import { Router } from 'express'
import mongoose from 'mongoose'
import Word from '../models/Word.js'
import Deck from '../models/Deck.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { validateCustomWord } from '../utils/words.js'

const router = Router()

router.get('/', requireDB, requireAuth, async (req, res) => {
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

router.get('/:id', requireDB, requireAuth, async (req, res) => {
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

// Add your own word. `word` is globally unique (case-insensitive): re-adding
// an existing word returns 409 with its id so the client can link it.
// The word lands in the caller's personal "My Words" deck, so it is
// immediately practicable in every study mode.
router.post('/', requireDB, requireAuth, async (req, res) => {
  try {
    const invalid = validateCustomWord(req.body)
    if (invalid) return res.status(400).json({ message: invalid })

    const { word, definition, example, partOfSpeech, difficulty } = req.body
    const existing = await Word.findOne({ word: word.trim().toLowerCase() })
    if (existing) {
      return res
        .status(409)
        .json({ message: 'That word already exists', existingWordId: existing._id })
    }

    const created = await Word.create({
      word: word.trim(),
      definition: definition.trim(),
      example: example?.trim() || undefined,
      partOfSpeech: partOfSpeech?.trim() || undefined,
      difficulty: difficulty || undefined,
      source: 'custom',
      createdBy: req.user._id,
    })

    const deck = await Deck.findOneAndUpdate(
      { createdBy: req.user._id, source: 'custom' },
      {
        $setOnInsert: { title: 'My Words', createdBy: req.user._id, source: 'custom' },
        $addToSet: { wordIds: created._id },
      },
      { new: true, upsert: true }
    )

    res.status(201).json({ word: created, deckId: deck._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
