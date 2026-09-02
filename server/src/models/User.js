import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    totalCorrect: { type: Number, default: 0 },
    totalReviewed: { type: Number, default: 0 },
    lastPracticeDate: { type: Date },
    practiceStreakDays: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
