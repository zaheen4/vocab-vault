import mongoose from 'mongoose'

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Word', required: true },
    box: { type: Number, min: 1, max: 5, default: 1 },
    streakCorrect: { type: Number, default: 0 },
    lastReviewed: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['new', 'learning', 'mastered'],
      default: 'new',
    },
  },
  { timestamps: true }
)

progressSchema.index({ userId: 1, wordId: 1 }, { unique: true })

export default mongoose.model('Progress', progressSchema)
