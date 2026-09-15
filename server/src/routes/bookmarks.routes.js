import { Router } from 'express'
import mongoose from 'mongoose'
import Bookmark from '../models/Bookmark.js'
import Progress from '../models/Progress.js'
import Word from '../models/Word.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { masteryFor } from '../utils/bookmarks.js'
import { toSafeMessage } from '../utils/security.js'

const router = Router()

function toBookmarkJson(doc, progressByWord) {
  const mastery = masteryFor(progressByWord?.get(doc.wordId?._id?.toString()))
  return { _id: doc._id, word: doc.wordId, addedAt: doc.createdAt, ...mastery }
}

// List my starred words, newest first, each with the user's SRS mastery.
router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    const docs = await Bookmark.find({ userId: req.user._id })
      .populate('wordId')
      .sort({ createdAt: -1 })
    const progressDocs = await Progress.find({
      userId: req.user._id,
      wordId: { $in: docs.map((d) => d.wordId?._id).filter(Boolean) },
    }).select('wordId status box')
    const byWord = new Map(progressDocs.map((p) => [p.wordId.toString(), p]))
    res.json({ bookmarks: docs.map((d) => toBookmarkJson(d, byWord)) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
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
    res.json({ bookmark: toBookmarkJson(doc, new Map()) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

// Practice session from saved words: unseen first (saved order), then due
// words oldest-first; seen-but-not-yet-due words are excluded until their
// SRS date arrives. Mirrors GET /decks/:id/practice selection.
router.get('/practice', requireDB, requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50)

    const saved = await Bookmark.find({ userId: req.user._id }).sort({ createdAt: -1 })
    const wordIds = saved.map((b) => b.wordId)

    const progressDocs = await Progress.find({
      userId: req.user._id,
      wordId: { $in: wordIds },
    })
    const byWordId = new Map(progressDocs.map((p) => [p.wordId.toString(), p]))

    const now = new Date()
    const unseen = []
    for (const wid of wordIds) {
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
    res.status(500).json({ message: toSafeMessage(err) })
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
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
