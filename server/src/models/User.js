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
    streakFreezes: { type: Number, default: 1 },
    dailyGoalTarget: { type: Number, default: 10, min: 1, max: 50 },
    reviewsToday: { type: Number, default: 0 },
    reviewsTodayDate: { type: Date },
    goalMetDate: { type: Date },
    goalsMet: { type: Number, default: 0 },
    activityLog: {
      type: [{ date: { type: Date }, reviews: { type: Number, default: 0 } }],
      default: [],
    },
    badges: {
      type: [{ id: { type: String, required: true }, awardedAt: { type: Date } }],
      default: [],
    },
    perfectRun: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
