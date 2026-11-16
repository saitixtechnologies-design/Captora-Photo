import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { AdminUser, connectDb, createWithId } from './db.js'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const displayName = 'Captora Admin'

if (!email || !password || password.length < 10) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters) in backend/.env, then run npm run create-admin.')
  process.exit(1)
}

try {
  await connectDb()
  if (await AdminUser.exists({ email })) {
    console.error('An admin with that email already exists. Use the password reset flow instead.')
    process.exit(1)
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await createWithId(AdminUser, { display_name: displayName, email, password_hash: passwordHash })
  console.log('Captora Admin account created. Remove ADMIN_PASSWORD from backend/.env after setup.')
  await mongoose.disconnect()
  process.exit(0)
} catch (error) {
  console.error('Could not create admin account:', error.message)
  process.exit(1)
}
