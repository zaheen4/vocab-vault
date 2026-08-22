import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true, lowercase: true },
    definition: { type: String, required: true },
    example: { type: String },
    partOfSpeech: { type: String },
    synonyms: [{ type: String }],
    banglaMeaning: { type: String },
    difficulty: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced'],
      default: 'basic',
    },
  },
  { timestamps: true }
)

wordSchema.index({ word: 1 }, { unique: true })

export default mongoose.model('Word', wordSchema)
