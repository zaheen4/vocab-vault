import mongoose from 'mongoose'

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Word', required: true },
  },
  { timestamps: true }
)

bookmarkSchema.index({ userId: 1, wordId: 1 }, { unique: true })

export default mongoose.model('Bookmark', bookmarkSchema)
