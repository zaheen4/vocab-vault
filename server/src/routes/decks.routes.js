import { Router } from 'express'
import mongoose from 'mongoose'
import Deck from '../models/Deck.js'
import Word from '../models/Word.js'
import Progress from '../models/Progress.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'

const router = Router()

router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    const decks = await Deck.find().select('-__v')
    res.json({
      decks: decks.map((deck) => ({
        ...deck.toObject(),
        wordCount: deck.wordIds.length,
      })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', requireDB, requireAuth, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).populate('wordIds')
    if (!deck) return res.status(404).json({ message: 'Deck not found' })
    res.json({ deck })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id/practice', requireDB, requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50)

    const deck = await Deck.findById(id).select('wordIds')
    if (!deck) return res.status(404).json({ message: 'Deck not found' })

    // unseen words first (deck order), then due words oldest-reviewDueAfter first;
    // seen-but-not-due words are excluded until their SRS date arrives
    const progressDocs = await Progress.find({
      userId: req.user._id,
      wordId: { $in: deck.wordIds },
    })
    const byWordId = new Map(progressDocs.map((p) => [p.wordId.toString(), p]))

    const now = new Date()
    const unseen = []
    for (const wid of deck.wordIds) {
      if (!byWordId.has(wid.toString())) unseen.push(wid)
    }
    const due = progressDocs
      .filter((p) => !p.reviewDueAfter || p.reviewDueAfter <= now)
      .sort(
        (a, b) =>
          (a.reviewDueAfter?.getTime() ?? 0) - (b.reviewDueAfter?.getTime() ?? 0)
      )
      .map((p) => p.wordId)

    const selectedIds = [...unseen, ...due].slice(0, limit)

    const selectedWords = await Word.find({ _id: { $in: selectedIds } })
    const wordById = new Map(selectedWords.map((w) => [w._id.toString(), w]))
    const words = selectedIds.map((wid) => wordById.get(wid.toString())).filter(Boolean)

    res.json({ words })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
