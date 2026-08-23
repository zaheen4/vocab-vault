import { Router } from 'express'
import mongoose from 'mongoose'
import Progress from '../models/Progress.js'
import Word from '../models/Word.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { nextReviewState } from '../utils/leitner.js'

const router = Router()

router.get('/summary', requireDB, requireAuth, async (req, res) => {
  try {
    const byStatus = await Progress.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    res.json({
      summary: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/review', requireDB, requireAuth, async (req, res) => {
  try {
    const { wordId, correct } = req.body || {}
    if (!wordId || !mongoose.isValidObjectId(wordId)) {
      return res.status(400).json({ message: 'Valid wordId is required' })
    }
    if (typeof correct !== 'boolean') {
      return res.status(400).json({ message: 'correct must be a boolean' })
    }

    const word = await Word.findById(wordId)
    if (!word) return res.status(404).json({ message: 'Word not found' })

    let progress = await Progress.findOne({ userId: req.user._id, wordId })
    if (!progress) {
      progress = new Progress({ userId: req.user._id, wordId, status: 'new' })
    }
    Object.assign(progress, nextReviewState(progress, correct))
    await progress.save()

    res.json({ progress })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
