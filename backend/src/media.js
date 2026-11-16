import fs from 'node:fs'
import mongoose from 'mongoose'
import sharp from 'sharp'

// Uploaded photos and videos are stored inside MongoDB (GridFS, bucket "media") and served from /api/media/:id.
// Photos are shrunk and converted to WebP before saving, so they load fast and use little database space.

const MAX_PHOTO_PX = 2560
const PHOTO_QUALITY = 82
// Widths the website may ask for (?w=...). Anything else is rounded up to the next one.
const WIDTHS = [160, 320, 480, 640, 900, 1200, 1600, 2000, 2560]
const MEDIA_PREFIX = '/api/media/'

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' })

// Chunks written before a failed upload (e.g. database full) must not stay behind using space.
async function removeChunks(fileId) {
  await mongoose.connection.db.collection('media.chunks').deleteMany({ files_id: fileId }).catch(() => {})
}

function writeToBucket(source, filename, contentType) {
  return new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(filename, { metadata: { contentType } })
    const fail = (error) => {
      if (!Buffer.isBuffer(source)) source.unpipe?.(upload)
      removeChunks(upload.id).finally(() => reject(error))
    }
    upload.once('finish', () => resolve(upload.id))
    upload.once('error', fail)
    if (Buffer.isBuffer(source)) return upload.end(source)
    source.once('error', fail)
    source.pipe(upload)
  })
}

// Removes chunks left by uploads that never finished (no matching file record), older than an hour
// so uploads still in progress are not touched. Runs when the server starts.
export async function cleanUpUnfinishedUploads() {
  const db = mongoose.connection.db
  const fileIds = new Set((await db.collection('media.files').find({}, { projection: { _id: 1 } }).toArray()).map((f) => String(f._id)))
  const hourAgo = mongoose.Types.ObjectId.createFromTime(Math.floor(Date.now() / 1000) - 3600)
  const groups = await db.collection('media.chunks').aggregate([
    { $match: { _id: { $lt: hourAgo } } },
    { $group: { _id: '$files_id' } },
  ]).toArray()
  const orphanIds = groups.map((g) => g._id).filter((id) => !fileIds.has(String(id)))
  if (!orphanIds.length) return 0
  const result = await db.collection('media.chunks').deleteMany({ files_id: { $in: orphanIds } })
  return result.deletedCount
}

async function storeOne(file) {
  if (file.mimetype.startsWith('image/')) {
    let photo
    try {
      photo = await sharp(file.path).rotate()
        .resize({ width: MAX_PHOTO_PX, height: MAX_PHOTO_PX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: PHOTO_QUALITY }).toBuffer()
    } catch {
      const error = new Error(`${file.originalname} could not be read as a photo. Try a JPG, PNG or WebP file.`)
      error.status = 400
      throw error
    }
    const id = await writeToBucket(photo, file.originalname.replace(/\.\w+$/, '') + '.webp', 'image/webp')
    return MEDIA_PREFIX + id
  }
  const id = await writeToBucket(fs.createReadStream(file.path), file.originalname, file.mimetype)
  return MEDIA_PREFIX + id
}

// Express middleware: run after multer. Moves each uploaded file into MongoDB and sets file.storedUrl.
export async function storeUploadsInDatabase(request, _response, next) {
  const files = [request.file, ...Object.values(request.files || {}).flat()].filter(Boolean)
  try {
    for (const file of files) file.storedUrl = await storeOne(file)
  } catch (error) {
    // Don't leave half of a multi-file upload behind.
    await deleteStoredMedia(files.map((file) => file.storedUrl))
    throw error
  } finally {
    await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => {})))
  }
  next()
}

// Express middleware: if the request ends in an error (validation, 404...), drop the files it just stored.
export function discardUploadsOnFailure(request, response, next) {
  response.once('finish', () => {
    if (response.statusCode < 400) return
    const files = [request.file, ...Object.values(request.files || {}).flat()].filter(Boolean)
    deleteStoredMedia(files.map((file) => file.storedUrl)).catch(() => {})
  })
  next()
}

function idFromUrl(url) {
  if (typeof url !== 'string' || !url.startsWith(MEDIA_PREFIX)) return null
  const id = url.slice(MEDIA_PREFIX.length).split('?')[0]
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null
}

// Removes stored files (ignores outside URLs and old /api/uploads files).
export async function deleteStoredMedia(urls) {
  const ids = [...new Set(urls.map(idFromUrl).filter(Boolean).map(String))]
  for (const id of ids) await bucket().delete(new mongoose.Types.ObjectId(id)).catch(() => {})
}

// Every media URL a service / gallery / feedback record points to.
export function mediaUrlsOf(doc) {
  if (!doc) return []
  const lists = [doc.gallery_urls, doc.media_urls].map((v) => (Array.isArray(v) ? v : []))
  return [doc.image_url, doc.media_url, doc.thumbnail_url, ...lists.flat()].filter(Boolean)
}

// After an edit: delete files the old record used that the new record no longer does.
export async function deleteReplacedMedia(before, after) {
  const kept = new Set(mediaUrlsOf(after))
  await deleteStoredMedia(mediaUrlsOf(before).filter((url) => !kept.has(url)))
}

// GET /api/media/:id — photos (optionally resized with ?w=) and videos (with seeking via Range requests).
export async function serveMedia(request, response) {
  const id = idFromUrl(MEDIA_PREFIX + request.params.id)
  const file = id && (await bucket().find({ _id: id }).limit(1).next())
  if (!file) return response.status(404).json({ error: 'File not found.' })
  const contentType = file.metadata?.contentType || 'application/octet-stream'
  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // a stored file never changes
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('ETag', `"${file._id}-${request.query.w || ''}"`)
  if (request.headers['if-none-match'] === response.getHeader('ETag')) return response.status(304).end()

  const requested = Number(request.query.w)
  if (contentType.startsWith('image/') && Number.isFinite(requested) && requested > 0) {
    const width = WIDTHS.find((w) => w >= requested) || MAX_PHOTO_PX
    response.type('image/webp')
    return bucket().openDownloadStream(id).pipe(sharp().resize({ width, withoutEnlargement: true }).webp({ quality: PHOTO_QUALITY }))
      .on('error', () => response.destroy()).pipe(response)
  }

  response.setHeader('Content-Type', contentType)
  response.setHeader('Accept-Ranges', 'bytes')
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range || '')
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : file.length - Number(range[2])
    let end = range[1] && range[2] ? Number(range[2]) : file.length - 1
    start = Math.max(0, start); end = Math.min(end, file.length - 1)
    if (start > end) { response.setHeader('Content-Range', `bytes */${file.length}`); return response.status(416).end() }
    response.status(206)
    response.setHeader('Content-Range', `bytes ${start}-${end}/${file.length}`)
    response.setHeader('Content-Length', end - start + 1)
    return bucket().openDownloadStream(id, { start, end: end + 1 }).on('error', () => response.destroy()).pipe(response)
  }
  response.setHeader('Content-Length', file.length)
  bucket().openDownloadStream(id).on('error', () => response.destroy()).pipe(response)
}
