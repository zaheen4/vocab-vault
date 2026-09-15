import { Router } from 'express'
import mongoose from 'mongoose'
import Deck from '../models/Deck.js'
import Word from '../models/Word.js'
import Progress from '../models/Progress.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { countDeckDue, summarizeDeckProgress } from '../utils/decks.js'
import { toSafeMessage } from '../utils/security.js'

const router = Router()

// Owner-scoped deck lookup: shared decks (no creator) plus the caller's own
// personal decks — never another user's. Unknown/forbidden ids read as 404
// so existence is never leaked.
function accessibleDeckQuery(id, userId) {
  return Deck.findOne({ _id: id, $or: [{ createdBy: null }, { createdBy: userId }] })
}

router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    // Caller-scoped: shared decks (no creator) plus the caller's own
    // personal decks — never another user's.
    const decks = await Deck.find({
      $or: [{ createdBy: null }, { createdBy: req.user._id }],
    }).select('-__v')
    // Caller-scoped progress join: one extra query for all of the user's
    // progress, matched to deck words in memory (no per-deck fan-out).
    const progressDocs = await Progress.find({ userId: req.user._id }).select('wordId status reviewDueAfter')
    const byWord = new Map(progressDocs.map((p) => [String(p.wordId), p.status]))
    const progressByDeck = new Map(
      summarizeDeckProgress(decks, byWord).map((s) => [s.deckId, s.progress])
    )
    const detailByWord = new Map(
      progressDocs.map((p) => [String(p.wordId), { status: p.status, reviewDueAfter: p.reviewDueAfter }])
    )
    const dueByDeck = new Map(
      countDeckDue(decks, detailByWord, new Date()).map((s) => [s.deckId, s.dueCount])
    )
    // Deterministic order: numeric group first, group-less decks last.
    const ordered = decks
      .map((deck) => ({
        ...deck.toObject(),
        wordCount: deck.wordIds.length,
        progress: progressByDeck.get(String(deck._id)) || { new: 0, learning: 0, mastered: 0 },
        dueCount: dueByDeck.get(String(deck._id)) ?? 0,
      }))
      .sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
    res.json({ decks: ordered })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/:id', requireDB, requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const deck = await accessibleDeckQuery(req.params.id, req.user._id).populate('wordIds')
    if (!deck) return res.status(404).json({ message: 'Deck not found' })
    res.json({ deck })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/:id/practice', requireDB, requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50)

    const deck = await accessibleDeckQuery(id, req.user._id).select('wordIds')
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
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

// Quiz pool: words in this deck the user has already viewed (has a Progress
// record for), most-recently-reviewed first. Unviewed words are excluded so
// quizzes test recall, not first exposure.
router.get('/:id/quiz', requireDB, requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100)

    const deck = await accessibleDeckQuery(id, req.user._id).select('title wordIds')
    if (!deck) return res.status(404).json({ message: 'Deck not found' })

    const seen = await Progress.find({
      userId: req.user._id,
      wordId: { $in: deck.wordIds },
    }).select('wordId lastReviewed')
    const byWordId = new Map(seen.map((p) => [p.wordId.toString(), p]))

    const viewed = await Word.find({ _id: { $in: [...byWordId.keys()] } })
    const words = viewed
      .sort(
        (a, b) =>
          (byWordId.get(b._id.toString()).lastReviewed?.getTime() ?? 0) -
          (byWordId.get(a._id.toString()).lastReviewed?.getTime() ?? 0)
      )
      .slice(0, limit)

    res.json({ deck: { _id: deck._id, title: deck.title }, words })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
