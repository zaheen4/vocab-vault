import 'dotenv/config'
import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[db] MONGODB_URI not set — running without database')
    return false
  }
  try {
    await mongoose.connect(uri)
    console.log('[db] MongoDB connected:', mongoose.connection.name)
    return true
  } catch (err) {
    console.warn('[db] MongoDB connection failed:', err.message)
    return false
  }
}
