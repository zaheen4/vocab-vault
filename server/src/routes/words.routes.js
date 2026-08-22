import { Router } from 'express'
import mongoose from 'mongoose'
import Word from '../models/Word.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, difficulty, page = 1, limit = 20 } = req.query
    const filter = {}
    if (q) filter.word = { $regex: q.toLowerCase(), $options: 'i' }
    if (difficulty) filter.difficulty = difficulty

    const [words, total] = await Promise.all([
      Word.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Word.countDocuments(filter),
    ])
    res.json({ words, total, page: Number(page) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const word = await Word.findById(req.params.id)
    if (!word) return res.status(404).json({ message: 'Word not found' })
    res.json({ word })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
