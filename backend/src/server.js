import dotenv from 'dotenv'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import nodemailer from 'nodemailer'
import { cleanUpUnfinishedUploads, deleteReplacedMedia, deleteStoredMedia, discardUploadsOnFailure, mediaUrlsOf, serveMedia, storeUploadsInDatabase } from './media.js'
import { AdminUser, connectDb, createWithId, Enquiry, Feedback, GalleryMedia, PasswordResetToken, PortfolioContent, Service } from './db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(here, '..')
// Local development reads backend/.env. On the live server, web.config sets DOTENV_CONFIG_PATH=.env.production.
dotenv.config({ path: path.resolve(backendRoot, process.env.DOTENV_CONFIG_PATH || '.env') })
const frontendDir = path.join(backendRoot, 'public')
const uploadDir = path.resolve(backendRoot, process.env.UPLOAD_DIR || 'uploads')
const port = Number(process.env.HTTP_PLATFORM_PORT || process.env.PORT || 4000)
// Size limit only for the public feedback photo; admin uploads (services, gallery) have no size limit.
const maxUploadBytes = Number(process.env.MAX_UPLOAD_MB || 100) * 1024 * 1024
const tokenCookie = 'captora_admin'
const app = express()

fs.mkdirSync(uploadDir, { recursive: true })
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
    },
  },
}))
app.use('/api', cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS.'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(cookieParser())
app.use('/api/uploads', express.static(uploadDir, {
  fallthrough: false,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  setHeaders(response) {
    response.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
})
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Please wait before requesting another reset link.' },
})
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many enquiries were sent. Please try again later.' },
})
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Please wait before sending more feedback.' },
})

const extensions = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/avif', '.avif'],
  ['video/mp4', '.mp4'], ['video/webm', '.webm'], ['video/quicktime', '.mov'],
])
const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDir),
  filename: (_request, file, callback) => callback(null, `${crypto.randomUUID()}${extensions.get(file.mimetype)}`),
})
function fileFilter(_request, file, callback) {
  if (!extensions.has(file.mimetype)) return callback(new Error('Upload a JPG, PNG, WebP, AVIF, MP4, WebM or MOV file.'))
  callback(null, true)
}
const upload = multer({ storage, fileFilter, limits: { files: 11 } })
// Each upload is saved to a temp file by multer, then moved into MongoDB (photos are compressed first).
const toDb = [asyncRoute(storeUploadsInDatabase), discardUploadsOnFailure, normalizeDriveLinks]

// A Google Drive share link (drive.google.com/file/d/ID/view) opens a web page, not a picture.
// For photos, swap it for Drive's direct image address. Drive video links are kept and played in Drive's player.
function driveFileId(url) {
  if (typeof url !== 'string') return ''
  const match = url.match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/)
  return match ? match[1] : ''
}
function drivePhotoUrl(url) {
  const id = driveFileId(url)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w2560` : url
}
function normalizeDriveLinks(request, _response, next) {
  const body = request.body || {}
  if (body.mediaType !== 'video') {
    for (const key of ['mediaUrl', 'imageUrl']) if (body[key]) body[key] = drivePhotoUrl(body[key].trim())
  }
  if (body.thumbnailUrl) body.thumbnailUrl = drivePhotoUrl(body.thumbnailUrl.trim())
  next()
}
const serviceUpload = [upload.fields([{ name: 'image', maxCount: 10 }, { name: 'video', maxCount: 1 }]), toDb]
const galleryUpload = [upload.fields([{ name: 'media', maxCount: 10 }, { name: 'thumbnail', maxCount: 1 }]), toDb]
const feedbackUpload = [multer({ storage, fileFilter(request, file, callback) {
  if (!file.mimetype.startsWith('image/')) return callback(inputError('Upload an image for your feedback photo.'))
  return fileFilter(request, file, callback)
}, limits: { fileSize: maxUploadBytes, files: 1 } }).single('image'), toDb]

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}
function validId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
function requiredText(value, maxLength, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    const error = new Error(`${label} is required and must be ${maxLength} characters or fewer.`)
    error.status = 400
    throw error
  }
  return value.trim()
}
function optionalText(value, maxLength = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}
function fileUrl(file) {
  if (!file) return null
  return file.storedUrl || `/api/uploads/${file.filename}`
}
function resetHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: 8 * 60 * 60 * 1000,
  }
}
function verifyAdmin(request, response, next) {
  const token = request.cookies[tokenCookie]
  if (!token || !process.env.JWT_SECRET) return response.status(401).json({ error: 'Please sign in to continue.' })
  try {
    request.admin = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    response.clearCookie(tokenCookie, cookieOptions())
    return response.status(401).json({ error: 'Your session expired. Please sign in again.' })
  }
}
// Read queries return plain objects without Mongo's _id, shaped like the old SQL rows.
function rows(query) {
  return query.select('-_id').lean()
}
// URL lists are arrays in MongoDB; older imported data may still hold a JSON string.
function urlList(value) {
  let list = value
  if (typeof value === 'string') { try { list = JSON.parse(value || '[]') } catch { list = [] } }
  return Array.isArray(list) ? list.filter((url) => typeof url === 'string' && url) : []
}
function parseRemoved(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string') : []
  } catch { throw inputError('Invalid removed photo list.') }
}
function sortOrderOf(value) {
  return Number.isInteger(Number(value)) ? Number(value) : 0
}
function mapService(row) {
  const images = urlList(row.gallery_urls)
  return {
    id: row.id,
    number: String(row.sort_order).padStart(2, '0'),
    title: row.title,
    description: row.description,
    detail: row.detail,
    image: row.image_url,
    mediaType: row.media_type || 'image',
    images: images.length ? images : (row.media_type === 'video' ? [] : [row.image_url]),
    video: row.media_type === 'video' ? row.image_url : null,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}
function mapMedia(row) {
  let images = urlList(row.media_urls)
  if (!images.length && row.media_type === 'image' && row.media_url) images = [row.media_url]
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    type: row.media_type,
    video: row.media_type === 'video' ? row.media_url : null,
    mediaUrl: row.media_url,
    images,
    image: row.thumbnail_url || images[0] || row.media_url,
    thumbnail: row.thumbnail_url,
    size: row.size,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}
// Same rules as the website forms (frontend/src/utils/validation.js).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/
function cleanPhone(value) {
  // Numbers only, with an optional + for the country code; spaces and dashes are removed first.
  const phone = optionalText(value, 40).replace(/[\s-]/g, '')
  if (phone && (!/^\+?\d{7,15}$/.test(phone) || phone.replace('+', '').length < 10)) throw inputError('Enter a valid phone number using numbers only.')
  return phone
}
function inputError(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

app.get('/api/health', asyncRoute(async (_request, response) => {
  await connectDb()
  response.json({ status: 'ok' })
}))

app.post('/api/auth/login', authLimiter, asyncRoute(async (request, response) => {
  const email = requiredText(request.body.email, 254, 'Email').toLowerCase()
  const password = requiredText(request.body.password, 200, 'Password')
  const admin = await AdminUser.findOne({ email }).lean()
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return response.status(401).json({ error: 'Email or password is incorrect.' })
  }
  const token = jwt.sign({ sub: String(admin.id), name: admin.display_name, email: admin.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' })
  response.cookie(tokenCookie, token, cookieOptions())
  response.json({ user: { id: admin.id, name: admin.display_name, email: admin.email } })
}))

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie(tokenCookie, cookieOptions())
  response.status(204).end()
})

app.get('/api/auth/me', verifyAdmin, (request, response) => {
  response.json({ user: { id: Number(request.admin.sub), name: request.admin.name || 'Captora Admin', email: request.admin.email } })
})

app.post('/api/auth/forgot-password', forgotLimiter, asyncRoute(async (request, response) => {
  const email = requiredText(request.body.email, 254, 'Email').toLowerCase()
  const genericMessage = 'If an administrator account matches that address, a reset link has been sent.'
  const admin = await AdminUser.findOne({ email }).select('id email').lean()
  if (!admin) return response.json({ message: genericMessage })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  await PasswordResetToken.updateMany({ admin_id: admin.id, used_at: null }, { $set: { used_at: new Date() } })
  await createWithId(PasswordResetToken, { admin_id: admin.id, token_hash: resetHash(token), expires_at: expiresAt })

  const origin = allowedOrigins[0]
  const resetUrl = `${origin}/admin/reset-password?token=${encodeURIComponent(token)}`
  const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.MAIL_FROM
  if (smtpReady) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: admin.email,
      subject: 'Reset your Captora admin password',
      text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
      html: `<p>Use the link below within 30 minutes to reset your Captora admin password.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    })
  } else if (process.env.NODE_ENV !== 'production' && process.env.RESET_LINK_DEV_MODE === 'true') {
    return response.json({ message: genericMessage, devResetUrl: resetUrl })
  } else {
    console.error('Password reset email is unavailable: configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD and MAIL_FROM.')
  }
  response.json({ message: genericMessage })
}))

app.post('/api/auth/reset-password', authLimiter, asyncRoute(async (request, response) => {
  const token = requiredText(request.body.token, 200, 'Reset token')
  const password = requiredText(request.body.password, 200, 'Password')
  if (password.length < 12) throw inputError('Choose a password with at least 12 characters.')
  const passwordHash = await bcrypt.hash(password, 12)
  // Claiming the token in one atomic update means a link can only ever be used once.
  const reset = await PasswordResetToken.findOneAndUpdate(
    { token_hash: resetHash(token), used_at: null, expires_at: { $gt: new Date() } },
    { $set: { used_at: new Date() } },
    { returnDocument: 'after' },
  ).lean()
  if (!reset) return response.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' })
  await AdminUser.updateOne({ id: reset.admin_id }, { $set: { password_hash: passwordHash } })
  response.json({ message: 'Password updated. You can now sign in.' })
}))

app.get('/api/media/:id', asyncRoute(serveMedia))

app.get('/api/public/services', asyncRoute(async (_request, response) => {
  const items = await rows(Service.find({ is_active: true }).sort({ sort_order: 1, created_at: 1 }))
  response.json({ items: items.map(mapService) })
}))

app.get('/api/public/gallery', asyncRoute(async (_request, response) => {
  const items = await rows(GalleryMedia.find({ is_active: true }).sort({ sort_order: 1, created_at: 1 }))
  response.json({ items: items.map(mapMedia) })
}))

// Portfolio page text and photos. `content` is null until the admin saves it once; the site then uses its defaults.
const portfolioKey = 'main'
const editablePages = new Set(['home'])
app.get('/api/public/portfolio-content', asyncRoute(async (_request, response) => {
  const doc = await PortfolioContent.findOne({ key: portfolioKey }).lean()
  response.json({ content: doc?.data || null })
}))

app.get('/api/public/page-content/:page', asyncRoute(async (request, response) => {
  if (!editablePages.has(request.params.page)) return response.status(404).json({ error: 'Unknown page.' })
  const doc = await PortfolioContent.findOne({ key: request.params.page }).lean()
  response.json({ content: doc?.data || null })
}))

app.get('/api/public/feedback', asyncRoute(async (_request, response) => {
  const items = await Feedback.find({ is_active: true }).sort({ created_at: -1, id: -1 })
    .select('-_id id name message rating image_url created_at').lean()
  response.json({ items })
}))

app.post('/api/public/feedback', feedbackLimiter, feedbackUpload, asyncRoute(async (request, response) => {
  const name = requiredText(request.body.name, 120, 'Name')
  const email = optionalText(request.body.email, 254).toLowerCase()
  if (email && !EMAIL_PATTERN.test(email)) throw inputError('Enter a valid email address.')
  const message = requiredText(request.body.message, 2000, 'Feedback')
  const publicConsent = request.body.publicConsent === 'on'
  if (!publicConsent) throw inputError('Please confirm whether Captora may feature your feedback publicly.')
  const rating = Number(request.body.rating || 5)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw inputError('Choose a rating from 1 to 5 stars.')
  const imageUrl = fileUrl(request.file) || ''
  const saved = await createWithId(Feedback, { name, email, message, rating, image_url: imageUrl, public_consent: publicConsent })
  response.status(201).json({ message: 'Thank you. Your feedback has been submitted for review.', id: saved.id })
}))
app.post('/api/public/enquiries', enquiryLimiter, asyncRoute(async (request, response) => {
  const name = requiredText(request.body.name, 120, 'Name')
  const email = requiredText(request.body.email, 254, 'Email').toLowerCase()
  if (!EMAIL_PATTERN.test(email)) throw inputError('Enter a valid email address.')
  const phone = cleanPhone(request.body.phone)
  const service = requiredText(request.body.service, 120, 'Service')
  const location = optionalText(request.body.location, 160)
  const message = optionalText(request.body.message, 3000)
  const dateValue = optionalText(request.body.date, 10)
  let eventDate = null
  if (dateValue) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || Number.isNaN(Date.parse(dateValue))) throw inputError('Enter a valid event date.')
    eventDate = new Date(`${dateValue}T00:00:00.000Z`)
  }
  const saved = await createWithId(Enquiry, { name, email, phone, service, event_date: eventDate, location, message })
  response.status(201).json({ message: 'Your enquiry has been received.', id: saved.id })
}))

app.use('/api/admin', verifyAdmin)

app.get('/api/admin/dashboard', asyncRoute(async (_request, response) => {
  const [services, activeServices, gallery, activeGallery] = await Promise.all([
    Service.countDocuments(), Service.countDocuments({ is_active: true }),
    GalleryMedia.countDocuments(), GalleryMedia.countDocuments({ is_active: true }),
  ])
  response.json({ stats: { services, activeServices, gallery, activeGallery } })
}))

app.get('/api/admin/services', asyncRoute(async (_request, response) => {
  const items = await rows(Service.find().sort({ sort_order: 1, created_at: -1 }))
  response.json({ items: items.map(mapService) })
}))

app.post('/api/admin/services', serviceUpload, asyncRoute(async (request, response) => {
  const title = requiredText(request.body.title, 120, 'Title')
  const description = requiredText(request.body.description, 1200, 'Description')
  const detail = optionalText(request.body.detail, 500)
  const mediaType = request.body.mediaType === 'video' ? 'video' : 'image'
  const imageFiles = request.files?.image || []
  const videoFile = request.files?.video?.[0]
  if (mediaType === 'video' && imageFiles.length) throw inputError('Choose either a video or photos for a service.')
  if (mediaType === 'video' && videoFile && !videoFile.mimetype.startsWith('video/')) throw inputError('The selected file does not match the chosen media type.')
  if (mediaType === 'image' && videoFile) throw inputError('The selected file does not match the chosen media type.')
  const uploaded = mediaType === 'video' ? [] : imageFiles.map(fileUrl)
  const mediaUrl = mediaType === 'video' ? (fileUrl(videoFile) || requiredText(request.body.imageUrl, 1000, 'Media')) : (uploaded[0] || requiredText(request.body.imageUrl, 1000, 'Media'))
  const galleryUrls = mediaType === 'image' ? (uploaded.length ? uploaded : [mediaUrl]) : []
  const saved = await createWithId(Service, {
    title, description, detail, image_url: mediaUrl, media_type: mediaType, gallery_urls: galleryUrls, sort_order: sortOrderOf(request.body.sortOrder),
  })
  response.status(201).json({ item: mapService(saved) })
}))

app.put('/api/admin/services/:id', serviceUpload, asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id) throw inputError('Service was not found.')
  const title = requiredText(request.body.title, 120, 'Title')
  const description = requiredText(request.body.description, 1200, 'Description')
  const detail = optionalText(request.body.detail, 500)
  const mediaType = request.body.mediaType === 'video' ? 'video' : 'image'
  const imageFiles = request.files?.image || []
  const videoFile = request.files?.video?.[0]
  if (mediaType === 'video' && imageFiles.length) throw inputError('Choose either a video or photos for a service.')
  if (mediaType === 'video' && videoFile && !videoFile.mimetype.startsWith('video/')) throw inputError('The selected file does not match the chosen media type.')
  if (mediaType === 'image' && videoFile) throw inputError('The selected file does not match the chosen media type.')
  const uploaded = mediaType === 'video' ? [] : imageFiles.map(fileUrl)
  const mediaUrlInput = optionalText(request.body.imageUrl, 1000)
  const mediaFileUrl = mediaType === 'video' ? fileUrl(videoFile) : (uploaded[0] || null)
  let galleryUrls = mediaType === 'video' ? [] : null
  let resolvedImageUrl = mediaFileUrl
  if (mediaType === 'image') {
    const current = await Service.findOne({ id }).select('media_type image_url gallery_urls').lean()
    if (!current) return response.status(404).json({ error: 'Service was not found.' })
    let currentImages = []
    if (current.media_type === 'image') {
      currentImages = urlList(current.gallery_urls)
      if (!currentImages.length && current.image_url) currentImages = [current.image_url]
    }
    const removedImages = parseRemoved(request.body.removedImages)
    const retainedImages = currentImages.filter((url) => !removedImages.includes(url))
    // A new photo link typed into the form replaces the service's main photo (it used to be ignored).
    if (mediaUrlInput && !currentImages.includes(mediaUrlInput)) {
      const mainIndex = retainedImages.indexOf(current.image_url)
      if (mainIndex >= 0) retainedImages[mainIndex] = mediaUrlInput
      else if (retainedImages.length && !removedImages.length) retainedImages[0] = mediaUrlInput
      else retainedImages.unshift(mediaUrlInput)
    }
    const combinedImages = [...retainedImages, ...uploaded]
    if (combinedImages.length > 10) throw inputError('A service can contain up to 10 photos. Remove some photos before adding more.')
    if (!combinedImages.length) throw inputError('Keep at least one photo or enter an image URL.')
    resolvedImageUrl = combinedImages[0]
    galleryUrls = combinedImages
  }
  const update = { title, description, detail, media_type: mediaType, sort_order: sortOrderOf(request.body.sortOrder) }
  const image = mediaType === 'image' ? resolvedImageUrl : mediaFileUrl
  if (image || mediaUrlInput) update.image_url = image || mediaUrlInput // otherwise keep the current media
  if (galleryUrls) update.gallery_urls = galleryUrls
  const before = await Service.findOne({ id }).lean()
  const saved = await rows(Service.findOneAndUpdate({ id }, { $set: update }, { returnDocument: 'after', runValidators: true }))
  if (!saved) return response.status(404).json({ error: 'Service was not found.' })
  await deleteReplacedMedia(before, saved)
  response.json({ item: mapService(saved) })
}))

app.patch('/api/admin/services/:id/status', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id || typeof request.body.isActive !== 'boolean') throw inputError('Choose an active or inactive status.')
  const result = await Service.updateOne({ id }, { $set: { is_active: request.body.isActive } })
  if (!result.matchedCount) return response.status(404).json({ error: 'Service was not found.' })
  response.json({ message: request.body.isActive ? 'Service is active.' : 'Service is inactive.' })
}))

app.delete('/api/admin/services/:id', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id) throw inputError('Service was not found.')
  const removed = await Service.findOneAndDelete({ id }).lean()
  if (!removed) return response.status(404).json({ error: 'Service was not found.' })
  await deleteStoredMedia(mediaUrlsOf(removed))
  response.status(204).end()
}))

app.get('/api/admin/enquiries', asyncRoute(async (_request, response) => {
  const items = await rows(Enquiry.find().sort({ created_at: -1, id: -1 }))
  response.json({ items })
}))

app.patch('/api/admin/enquiries/:id/status', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  const status = request.body.status
  if (!id || !['new', 'read'].includes(status)) throw inputError('Choose a valid enquiry status.')
  const result = await Enquiry.updateOne({ id }, { $set: { status } })
  if (!result.matchedCount) return response.status(404).json({ error: 'Enquiry was not found.' })
  response.json({ message: status === 'read' ? 'Enquiry marked as reviewed.' : 'Enquiry marked as new.' })
}))

app.delete('/api/admin/enquiries/:id', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id) throw inputError('Enquiry was not found.')
  const result = await Enquiry.deleteOne({ id })
  if (!result.deletedCount) return response.status(404).json({ error: 'Enquiry was not found.' })
  response.status(204).end()
}))

app.get('/api/admin/feedback', asyncRoute(async (_request, response) => {
  const items = await rows(Feedback.find().sort({ created_at: -1, id: -1 }))
  response.json({ items })
}))

app.patch('/api/admin/feedback/:id/status', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id || typeof request.body.isActive !== 'boolean') throw inputError('Choose active or inactive status.')
  const current = await Feedback.findOne({ id }).select('public_consent').lean()
  if (!current) return response.status(404).json({ error: 'Feedback was not found.' })
  if (request.body.isActive && !current.public_consent) throw inputError('This client did not give permission to publish their feedback.')
  await Feedback.updateOne({ id }, { $set: { is_active: request.body.isActive } })
  response.json({ message: request.body.isActive ? 'Feedback is now live on the website.' : 'Feedback is hidden from the website.' })
}))

app.delete('/api/admin/feedback/:id', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id) throw inputError('Feedback was not found.')
  const removed = await Feedback.findOneAndDelete({ id }).lean()
  if (!removed) return response.status(404).json({ error: 'Feedback was not found.' })
  await deleteStoredMedia(mediaUrlsOf(removed))
  response.status(204).end()
}))

// Keeps only plain text, numbers, true/false, lists and objects with simple keys, within sensible limits.
const blockedKeys = new Set(['__proto__', 'constructor', 'prototype'])
function cleanContent(value, depth = 0) {
  if (depth > 6) return null
  if (typeof value === 'string') return value.slice(0, 5000)
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 60).map((item) => cleanContent(item, depth + 1))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value).slice(0, 80)) {
      if (!blockedKeys.has(key) && /^[\w-]{1,40}$/.test(key)) out[key] = cleanContent(item, depth + 1)
    }
    return out
  }
  return null
}
function stringsIn(value, found = new Set()) {
  if (typeof value === 'string') found.add(value)
  else if (Array.isArray(value)) value.forEach((item) => stringsIn(item, found))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => stringsIn(item, found))
  return found
}

async function readPageContent(key, response) {
  const doc = await PortfolioContent.findOne({ key }).lean()
  response.json({ content: doc?.data || null, updatedAt: doc?.updated_at || null })
}

async function savePageContent(key, request, response) {
  const content = cleanContent(request.body?.content)
  if (!content || typeof content !== 'object' || Array.isArray(content)) throw inputError('Page content is missing.')
  const before = await PortfolioContent.findOne({ key }).lean()
  // Photos and videos uploaded from the editor that the saved page no longer uses are deleted from the database.
  const used = stringsIn(content)
  const uploads = before?.uploads || []
  const unused = uploads.filter((url) => !used.has(url))
  const saved = await PortfolioContent.findOneAndUpdate(
    { key },
    { $set: { data: content, uploads: uploads.filter((url) => used.has(url)) } },
    { upsert: true, returnDocument: 'after' },
  ).lean()
  await deleteStoredMedia(unused)
  response.json({ content: saved.data, updatedAt: saved.updated_at })
}

async function rememberUpload(key, request, response) {
  const url = fileUrl(request.file)
  if (!url) throw inputError('Choose a file to upload.')
  await PortfolioContent.updateOne({ key }, { $addToSet: { uploads: url }, $setOnInsert: { data: {} } }, { upsert: true })
  response.status(201).json({ url, type: request.file.mimetype.startsWith('video/') ? 'video' : 'image' })
}

app.get('/api/admin/portfolio-content', asyncRoute((_request, response) => readPageContent(portfolioKey, response)))
app.put('/api/admin/portfolio-content', asyncRoute((request, response) => savePageContent(portfolioKey, request, response)))

const portfolioPhotoUpload = [multer({ storage, fileFilter(request, file, callback) {
  if (!file.mimetype.startsWith('image/')) return callback(inputError('Upload a JPG, PNG, WebP or AVIF photo.'))
  return fileFilter(request, file, callback)
}, limits: { files: 1 } }).single('image'), toDb]

app.post('/api/admin/portfolio-content/photo', portfolioPhotoUpload, asyncRoute((request, response) => rememberUpload(portfolioKey, request, response)))

// Editable pages other than the portfolio (e.g. the homepage). Photos and videos upload as one "file" field.
function pageKey(request, _response, next) {
  if (!editablePages.has(request.params.page)) return next(Object.assign(new Error('Unknown page.'), { status: 404 }))
  next()
}
const pageMediaUpload = [pageKey, upload.single('file'), toDb]

app.get('/api/admin/page-content/:page', pageKey, asyncRoute((request, response) => readPageContent(request.params.page, response)))
app.put('/api/admin/page-content/:page', pageKey, asyncRoute((request, response) => savePageContent(request.params.page, request, response)))
app.post('/api/admin/page-content/:page/media', pageMediaUpload, asyncRoute((request, response) => rememberUpload(request.params.page, request, response)))

app.get('/api/admin/gallery', asyncRoute(async (_request, response) => {
  const items = await rows(GalleryMedia.find().sort({ sort_order: 1, created_at: -1 }))
  response.json({ items: items.map(mapMedia) })
}))

app.get('/api/admin/gallery/categories', asyncRoute(async (_request, response) => {
  const categories = await GalleryMedia.distinct('category')
  response.json({ items: [...new Set(categories.map((c) => c?.trim()).filter(Boolean))].sort() })
}))

app.post('/api/admin/gallery', galleryUpload, asyncRoute(async (request, response) => {
  const title = requiredText(request.body.title, 160, 'Title')
  const category = requiredText(request.body.category, 80, 'Category')
  const location = optionalText(request.body.location, 160)
  const mediaType = request.body.mediaType
  if (!['image', 'video'].includes(mediaType)) throw inputError('Choose image or video media.')
  const mediaFiles = request.files?.media || []
  if (mediaType === 'video' && mediaFiles.length > 1) throw inputError('Upload one video per gallery story.')
  if (mediaFiles.some((file) => (mediaType === 'image') !== file.mimetype.startsWith('image/'))) throw inputError('The selected file does not match the chosen media type.')
  if (!mediaFiles.length && !request.body.mediaUrl) throw inputError('Choose a media file or enter a media URL.')
  const thumbnailFile = fileUrl(request.files?.thumbnail?.[0])
  const thumbnailUrl = optionalText(request.body.thumbnailUrl, 1000)
  const size = ['normal', 'wide', 'tall'].includes(request.body.size) ? request.body.size : 'normal'
  const urls = mediaFiles.length ? mediaFiles.map(fileUrl) : [requiredText(request.body.mediaUrl, 1000, 'Media file')]
  const mediaUrl = urls[0]
  const saved = await createWithId(GalleryMedia, {
    title, category, location, media_type: mediaType, media_url: mediaUrl,
    media_urls: mediaType === 'image' ? urls : [],
    thumbnail_url: thumbnailFile || (mediaType === 'image' ? mediaUrl : thumbnailUrl) || null,
    size, sort_order: sortOrderOf(request.body.sortOrder),
  })
  response.status(201).json({ item: mapMedia(saved) })
}))

app.put('/api/admin/gallery/:id', galleryUpload, asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id) throw inputError('Gallery item was not found.')
  const title = requiredText(request.body.title, 160, 'Title')
  const category = requiredText(request.body.category, 80, 'Category')
  const location = optionalText(request.body.location, 160)
  const mediaType = request.body.mediaType
  if (!['image', 'video'].includes(mediaType)) throw inputError('Choose image or video media.')
  const mediaFiles = request.files?.media || []
  if (mediaType === 'video' && mediaFiles.length > 1) throw inputError('Upload one video per gallery story.')
  if (mediaFiles.some((file) => (mediaType === 'image') !== file.mimetype.startsWith('image/'))) throw inputError('The selected file does not match the chosen media type.')
  const thumbnailFile = request.files?.thumbnail?.[0]
  const size = ['normal', 'wide', 'tall'].includes(request.body.size) ? request.body.size : 'normal'
  let mediaUrl = mediaFiles.length ? fileUrl(mediaFiles[0]) : null
  let mediaUrls = mediaType === 'video' ? [] : null
  const removedImages = parseRemoved(request.body.removedImages)
  if (mediaType === 'image') {
    const existing = await GalleryMedia.findOne({ id }).select('media_type media_url media_urls').lean()
    if (!existing) return response.status(404).json({ error: 'Gallery item was not found.' })
    let existingImages = []
    if (existing.media_type === 'image') {
      existingImages = urlList(existing.media_urls)
      if (!existingImages.length && existing.media_url) existingImages = [existing.media_url]
    }
    const retainedImages = existingImages.filter((url) => !removedImages.includes(url))
    const urlInput = optionalText(request.body.mediaUrl, 1000)
    // A new photo link typed into the form replaces the story's main photo (it used to be ignored).
    if (urlInput && !existingImages.includes(urlInput)) {
      const mainIndex = retainedImages.indexOf(existing.media_url)
      if (mainIndex >= 0) retainedImages[mainIndex] = urlInput
      else if (retainedImages.length && !removedImages.length) retainedImages[0] = urlInput
      else retainedImages.unshift(urlInput)
    }
    const combinedImages = [...retainedImages, ...mediaFiles.map(fileUrl)]
    if (combinedImages.length > 10) throw inputError(`This story can contain up to 10 photos. Remove some photos before adding more.`)
    if (!combinedImages.length && !urlInput) throw inputError('Keep at least one photo or enter a media URL.')
    mediaUrl = combinedImages[0] || urlInput
    mediaUrls = combinedImages.length ? combinedImages : [urlInput]
  }
  const mediaUrlInput = optionalText(request.body.mediaUrl, 1000)
  const thumbnailUpload = fileUrl(thumbnailFile)
  const thumbnailInput = optionalText(request.body.thumbnailUrl, 1000)
  const update = { title, category, location, media_type: mediaType, size, sort_order: sortOrderOf(request.body.sortOrder) }
  if (mediaUrl || mediaUrlInput) update.media_url = mediaUrl || mediaUrlInput // otherwise keep the current media
  if (mediaUrls) update.media_urls = mediaUrls
  const before = await GalleryMedia.findOne({ id }).lean()
  if (!before) return response.status(404).json({ error: 'Gallery item was not found.' })
  let thumbnail = thumbnailUpload || thumbnailInput || null
  if (mediaType === 'image' && !thumbnailUpload) {
    // The cover of a photo story follows its first photo. The form sends back the old cover, so an
    // automatic cover (one of the old photos) must be recalculated; only a separately uploaded cover is kept.
    const oldPhotos = new Set([...urlList(before.media_urls), before.media_url].filter(Boolean))
    const photos = mediaUrls || (before.media_type === 'image' ? urlList(before.media_urls) : [])
    const firstPhoto = photos[0] || update.media_url || before.media_url
    const isCustomCover = thumbnailInput && !oldPhotos.has(thumbnailInput) && before.media_type === 'image'
    thumbnail = isCustomCover ? thumbnailInput : firstPhoto
  }
  if (thumbnail) update.thumbnail_url = thumbnail
  const saved = await rows(GalleryMedia.findOneAndUpdate({ id }, { $set: update }, { returnDocument: 'after', runValidators: true }))
  if (!saved) return response.status(404).json({ error: 'Gallery item was not found.' })
  await deleteReplacedMedia(before, saved)
  response.json({ item: mapMedia(saved) })
}))

app.patch('/api/admin/gallery/:id/status', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id || typeof request.body.isActive !== 'boolean') throw inputError('Choose an active or inactive status.')
  const result = await GalleryMedia.updateOne({ id }, { $set: { is_active: request.body.isActive } })
  if (!result.matchedCount) return response.status(404).json({ error: 'Gallery item was not found.' })
  response.json({ message: request.body.isActive ? 'Gallery item is active.' : 'Gallery item is inactive.' })
}))

app.delete('/api/admin/gallery/:id', asyncRoute(async (request, response) => {
  const id = validId(request.params.id)
  if (!id) throw inputError('Gallery item was not found.')
  const removed = await GalleryMedia.findOneAndDelete({ id }).lean()
  if (!removed) return response.status(404).json({ error: 'Gallery item was not found.' })
  await deleteStoredMedia(mediaUrlsOf(removed))
  response.status(204).end()
}))

const notFound = (_request, response) => response.status(404).json({ error: 'Endpoint not found.' })
app.use('/api', notFound)
app.use(express.static(frontendDir))
app.get(/^(?!\/assets(?:\/|$))(?!.*\.[^/]+$)/i, (_request, response, next) => {
  response.sendFile(path.join(frontendDir, 'index.html'), (error) => {
    if (error) next(error.status === 404 ? undefined : error)
  })
})
app.use(notFound)
app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `Files must be smaller than ${process.env.MAX_UPLOAD_MB || 100} MB.`
      : 'The upload could not be processed.'
    return response.status(400).json({ error: message })
  }
  if (error.status) return response.status(error.status).json({ error: error.message })
  if (/space quota/i.test(error.message || '')) return response.status(507).json({ error: 'Database storage is full (MongoDB Atlas quota reached). Delete old photos/videos or upgrade the Atlas cluster, then try again.' })
  if (error.name === 'ValidationError') return response.status(400).json({ error: Object.values(error.errors)[0]?.message || 'Some details are invalid.' })
  if (error.message?.includes('CORS')) return response.status(403).json({ error: 'This website is not allowed to call the admin API.' })
  console.error(error)
  response.status(503).json({ error: 'The request could not be completed. Check the API and database configuration.' })
})

if (!process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32)) {
  console.error('JWT_SECRET must be set to a strong secret of at least 32 characters.')
  process.exit(1)
}

try {
  const connection = await connectDb()
  console.log(`MongoDB Atlas connected (database: ${connection.name})`)
  cleanUpUnfinishedUploads()
    .then((count) => { if (count) console.log(`Removed ${count} leftover chunks from unfinished uploads`) })
    .catch((error) => console.warn('Could not clean up unfinished uploads:', error.message))
} catch (error) {
  console.error('Could not connect to MongoDB Atlas:', error.message)
  console.error('Check MONGO_URI in backend/.env and allow your IP in Atlas -> Network Access.')
  process.exit(1)
}
console.log('Uploads are stored in MongoDB (GridFS bucket "media")')
app.listen(port, () => console.log(`Captora admin API listening on port ${port}`))
