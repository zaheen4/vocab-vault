import mongoose from 'mongoose'

const customListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 60 },
    wordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Word' }],
  },
  { timestamps: true }
)

export default mongoose.model('CustomList', customListSchema)
