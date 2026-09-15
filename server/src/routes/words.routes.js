import { Router } from 'express'
import mongoose from 'mongoose'
import Word from '../models/Word.js'
import Deck from '../models/Deck.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { validateCustomWord, WORD_DIFFICULTIES } from '../utils/words.js'
import {
  MAX_QUERY_LENGTH,
  escapeRegExp,
  isDuplicateKeyError,
  parsePagination,
  toSafeMessage,
} from '../utils/security.js'

const router = Router()

router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    const { q, difficulty } = req.query
    const { page, limit } = parsePagination(req.query, { defaultPage: 1, defaultLimit: 20, maxLimit: 100 })
    const filter = {}
    if (typeof q === 'string' && q.trim()) {
      // Escaped substring search, capped length: meta-characters are matched
      // literally (no ReDoS payloads) and leading wildcards stay bounded.
      filter.word = { $regex: escapeRegExp(q.trim().slice(0, MAX_QUERY_LENGTH)), $options: 'i' }
    } else if (q !== undefined && typeof q !== 'string') {
      return res.status(400).json({ message: 'q must be a string' })
    }
    if (difficulty !== undefined) {
      if (!WORD_DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({ message: `difficulty must be one of: ${WORD_DIFFICULTIES.join(', ')}` })
      }
      filter.difficulty = difficulty
    }

    const [words, total] = await Promise.all([
      Word.find(filter)
        .skip((page - 1) * limit)
        .limit(limit),
      Word.countDocuments(filter),
    ])
    res.json({ words, total, page })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
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
    res.status(500).json({ message: toSafeMessage(err) })
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
    // Concurrent same-word posts can both pass the findOne check; the unique
    // index settles the race — report it as 409, not 500.
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: 'That word already exists' })
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
