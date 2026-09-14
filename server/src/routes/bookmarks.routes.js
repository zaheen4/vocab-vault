import { Router } from 'express'
import mongoose from 'mongoose'
import Bookmark from '../models/Bookmark.js'
import Word from '../models/Word.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'

const router = Router()

function toBookmarkJson(doc) {
  return { _id: doc._id, word: doc.wordId, addedAt: doc.createdAt }
}

// List my starred words, newest first.
router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    const docs = await Bookmark.find({ userId: req.user._id })
      .populate('wordId')
      .sort({ createdAt: -1 })
    res.json({ bookmarks: docs.map(toBookmarkJson) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Star a word. Idempotent: an existing star returns 200 with the same shape.
router.post('/', requireDB, requireAuth, async (req, res) => {
  try {
    const { wordId } = req.body || {}
    if (!wordId || !mongoose.isValidObjectId(wordId)) {
      return res.status(400).json({ message: 'Valid wordId is required' })
    }
    const word = await Word.findById(wordId)
    if (!word) return res.status(404).json({ message: 'Word not found' })

    let doc = await Bookmark.findOne({ userId: req.user._id, wordId }).populate('wordId')
    if (!doc) {
      doc = await Bookmark.create({ userId: req.user._id, wordId })
      doc = await doc.populate('wordId')
    }
    res.json({ bookmark: toBookmarkJson(doc) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Unstar a word. Idempotent: still 200 when nothing was starred.
router.delete('/:wordId', requireDB, requireAuth, async (req, res) => {
  try {
    const { wordId } = req.params
    if (!mongoose.isValidObjectId(wordId)) {
      return res.status(400).json({ message: 'Valid wordId is required' })
    }
    await Bookmark.deleteOne({ userId: req.user._id, wordId })
    res.json({ removed: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
