import dns from 'node:dns'
import mongoose from 'mongoose'

// MongoDB Atlas via Mongoose. Set MONGO_URI in backend/.env.
// Records keep a numeric `id` and snake_case fields so the API responses stay the same as before.

let connecting

async function connectOnce(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
}

export function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection)
  if (!connecting) {
    const uri = process.env.MONGO_URI?.trim()
    if (!uri) return Promise.reject(new Error('MONGO_URI is not set in backend/.env. Paste your MongoDB Atlas connection string there.'))
    connecting = connectOnce(uri)
      .catch(async (error) => {
        // Some home/ISP routers refuse the SRV lookup that mongodb+srv:// needs; retry through public DNS.
        if (!/querySrv|ENOTFOUND|ECONNREFUSED|ETIMEOUT/.test(error.message)) throw error
        console.warn('Atlas DNS lookup failed on this network, retrying with public DNS (8.8.8.8, 1.1.1.1)...')
        dns.setServers(['8.8.8.8', '1.1.1.1'])
        await connectOnce(uri)
      })
      .then(() => mongoose.connection)
      .catch((error) => { connecting = null; throw error })
  }
  return connecting
}

const timestamps = { createdAt: 'created_at', updatedAt: 'updated_at' }
const options = (collection, withUpdated = true) => ({
  collection,
  versionKey: false,
  timestamps: withUpdated ? timestamps : { createdAt: 'created_at', updatedAt: false },
})

// Auto-incrementing numeric ids, one counter per collection.
const Counter = mongoose.model('Counter', new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { collection: 'counters', versionKey: false }))
export async function nextId(name) {
  const counter = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true }).lean()
  return counter.seq
}

const idField = { type: Number, required: true, unique: true }

export const AdminUser = mongoose.model('AdminUser', new mongoose.Schema({
  id: idField,
  display_name: { type: String, default: 'Captora Admin', maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password_hash: { type: String, required: true },
}, options('admin_users', false)))

export const PasswordResetToken = mongoose.model('PasswordResetToken', new mongoose.Schema({
  id: idField,
  admin_id: { type: Number, required: true, index: true },
  token_hash: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  used_at: { type: Date, default: null },
}, options('password_reset_tokens', false)))

export const Service = mongoose.model('Service', new mongoose.Schema({
  id: idField,
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 1200 },
  detail: { type: String, default: '', maxlength: 500 },
  image_url: { type: String, required: true, maxlength: 1000 },
  media_type: { type: String, enum: ['image', 'video'], default: 'image' },
  gallery_urls: { type: [String], default: [] },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, options('captora_services')).index({ is_active: 1, sort_order: 1, created_at: 1 }))

export const GalleryMedia = mongoose.model('GalleryMedia', new mongoose.Schema({
  id: idField,
  title: { type: String, required: true, maxlength: 160 },
  category: { type: String, required: true, maxlength: 80 },
  location: { type: String, default: '', maxlength: 160 },
  media_type: { type: String, enum: ['image', 'video'], required: true },
  media_url: { type: String, required: true, maxlength: 1000 },
  media_urls: { type: [String], default: [] },
  thumbnail_url: { type: String, default: null, maxlength: 1000 },
  size: { type: String, enum: ['normal', 'wide', 'tall'], default: 'normal' },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, options('captora_gallery_media')).index({ is_active: 1, sort_order: 1, created_at: 1 }))

export const Enquiry = mongoose.model('Enquiry', new mongoose.Schema({
  id: idField,
  name: { type: String, required: true, maxlength: 120 },
  email: { type: String, required: true, maxlength: 254 },
  phone: { type: String, default: '', maxlength: 40 },
  service: { type: String, required: true, maxlength: 120 },
  event_date: { type: Date, default: null },
  location: { type: String, default: '', maxlength: 160 },
  message: { type: String, default: '', maxlength: 3000 },
  status: { type: String, enum: ['new', 'read'], default: 'new' },
}, options('captora_enquiries', false)).index({ status: 1, created_at: -1 }))

export const Feedback = mongoose.model('Feedback', new mongoose.Schema({
  id: idField,
  name: { type: String, required: true, maxlength: 120 },
  email: { type: String, default: '', maxlength: 254 },
  message: { type: String, required: true, maxlength: 2000 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  image_url: { type: String, default: '', maxlength: 1000 },
  public_consent: { type: Boolean, default: false },
  is_active: { type: Boolean, default: false },
}, options('captora_feedback', false)).index({ is_active: 1, created_at: -1 }))

// Creates a record with the next numeric id and returns it as a plain object.
export async function createWithId(Model, data) {
  const doc = await Model.create({ id: await nextId(Model.collection.collectionName), ...data })
  return plain(doc.toObject())
}

// Editable text and photos of the public Portfolio page (one document, key "main").
// `uploads` lists the photos uploaded from the editor, so ones no longer used can be deleted safely.
export const PortfolioContent = mongoose.model('PortfolioContent', new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  uploads: { type: [String], default: [] },
}, { collection: 'captora_portfolio_content', versionKey: false, minimize: false, timestamps }))

// Strips Mongo's internal _id so responses look like the old SQL rows.
export function plain(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc // eslint-disable-line no-unused-vars
  return rest
}
