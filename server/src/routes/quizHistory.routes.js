import { Router } from 'express'
import mongoose from 'mongoose'
import QuizSession from '../models/QuizSession.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { toSafeMessage } from '../utils/security.js'
import {
  validateQuizSessionPayload,
  validateQuizHistoryQuery,
  buildQuizHistoryPipeline,
  pruneOldSessions,
} from '../utils/quizHistory.js'

const router = Router()

router.post('/session', requireDB, requireAuth, async (req, res) => {
  try {
    const validated = validateQuizSessionPayload(req.body)
    if (!validated.valid) {
      return res.status(400).json({ message: validated.error })
    }

    const session = new QuizSession({
      userId: req.user._id,
      ...validated.data,
    })

    await session.save()

    // Non-blocking prune: keeps user within the 100-attempt boundary
    pruneOldSessions(QuizSession, req.user._id)

    res.status(201).json({ session })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/history', requireDB, requireAuth, async (req, res) => {
  try {
    const validated = validateQuizHistoryQuery(req.query)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }

    const { page, limit } = validated
    const pipeline = buildQuizHistoryPipeline(req.user._id, { page, limit })
    const [result] = await QuizSession.aggregate(pipeline)

    const sessions = result?.sessions || []
    const total = result?.totalCount?.[0]?.count || 0
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0
    const rawStats = result?.stats?.[0] || {}

    const stats = {
      totalQuizzes: rawStats.totalQuizzes || 0,
      averageScore: rawStats.avgScore !== undefined && rawStats.avgScore !== null
        ? Math.round(rawStats.avgScore)
        : 0,
      bestScore: rawStats.bestScore || 0,
      totalQuestions: rawStats.totalQuestions || 0,
    }

    res.json({
      sessions,
      total,
      page,
      limit,
      totalPages,
      stats,
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/history/:id', requireDB, requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Valid session id is required' })
    }

    const session = await QuizSession.findOne({ _id: id, userId: req.user._id }).lean()
    if (!session) {
      return res.status(404).json({ message: 'Quiz session not found' })
    }

    res.json({ session })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
