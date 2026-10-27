import mongoose from 'mongoose'

const quizAnswerSchema = new mongoose.Schema(
  {
    wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Word', required: true },
    word: { type: String, required: true },
    definition: { type: String, required: true },
    partOfSpeech: { type: String, default: null },
    userAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
)

const quizSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', default: null },
    deckTitle: { type: String, required: true },
    part: { type: Number, default: null },
    scope: { type: String, enum: ['viewed', 'all'], default: 'viewed' },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    answers: { type: [quizAnswerSchema], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
)

quizSessionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('QuizSession', quizSessionSchema)
