import { Router } from 'express'
import mongoose from 'mongoose'
import Progress from '../models/Progress.js'
import Word from '../models/Word.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { reviewLimiter } from '../middleware/rateLimit.js'
import { nextReviewState } from '../utils/leitner.js'
import {
  xpForAnswer,
  levelFor,
  applyDailyStreak,
  awardGoalRefill,
  awardBadges,
} from '../utils/gamify.js'
import { MAX_ACTIVITY_DAYS, MAX_HISTORY_ENTRIES } from '../utils/analytics.js'
import { isDuplicateKeyError, toSafeMessage } from '../utils/security.js'
import { validateHistoryQuery, buildHistoryPipeline } from '../utils/history.js'
import { buildWordQueuePipeline, readWordQueue } from '../utils/wordQueue.js'

const router = Router()

router.get('/summary', requireDB, requireAuth, async (req, res) => {
  try {
    const byStatus = await Progress.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]))
    res.json({
      summary: { new: counts.new || 0, learning: counts.learning || 0, mastered: counts.mastered || 0 },
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/due', requireDB, requireAuth, async (req, res) => {
  try {
    const rawLimit = req.query.limit
    const limit = rawLimit ? Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 20)) : 20
    const now = new Date()

    const filter = {
      userId: req.user._id,
      status: { $ne: 'new' },
      reviewDueAfter: { $lte: now },
    }

    const result = await Progress.aggregate(
      buildWordQueuePipeline({ match: filter, sort: { reviewDueAfter: 1 }, limit })
    )
    const { words, total: totalDue } = readWordQueue(result)
    res.json({ words, totalDue })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/weak', requireDB, requireAuth, async (req, res) => {
  try {
    const rawLimit = req.query.limit
    const limit = rawLimit ? Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 20)) : 20

    const filter = {
      userId: req.user._id,
      status: 'learning',
      box: 1,
    }

    const result = await Progress.aggregate(
      buildWordQueuePipeline({
        match: filter,
        sort: { streakCorrect: 1, lastReviewed: -1 },
        limit,
      })
    )
    const { words, total: totalWeak } = readWordQueue(result)
    res.json({ words, totalWeak })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/word/:wordId', requireDB, requireAuth, async (req, res) => {
  try {
    const { wordId } = req.params
    if (!mongoose.isValidObjectId(wordId)) {
      return res.status(400).json({ message: 'Valid wordId is required' })
    }
    const word = await Word.findById(wordId)
    if (!word) return res.status(404).json({ message: 'Word not found' })

    const progress = await Progress.findOne({ userId: req.user._id, wordId })
    if (!progress) {
      return res.json({
        progress: {
          wordId,
          box: 1,
          status: 'new',
          streakCorrect: 0,
          lastReviewed: null,
          reviewDueAfter: null,
          history: [],
        },
      })
    }
    res.json({
      progress: {
        wordId,
        box: progress.box,
        status: progress.status,
        streakCorrect: progress.streakCorrect,
        lastReviewed: progress.lastReviewed,
        reviewDueAfter: progress.reviewDueAfter,
        history: progress.history || [],
      },
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/history', requireDB, requireAuth, async (req, res) => {
  try {
    const validated = validateHistoryQuery(req.query)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }
    const { page, limit, filter } = validated
    const pipeline = buildHistoryPipeline(req.user._id, { page, limit, filter })
    const [result] = await Progress.aggregate(pipeline)
    const history = result?.data || []
    const total = result?.totalCount?.[0]?.count || 0
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0

    res.json({
      history,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export function reviewDayKey(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function needsReviewsTodayReset(reviewsTodayDate, now) {
  const todayKey = reviewDayKey(now)
  const lastKey = reviewsTodayDate
    ? Date.UTC(
        new Date(reviewsTodayDate).getFullYear(),
        new Date(reviewsTodayDate).getMonth(),
        new Date(reviewsTodayDate).getDate()
      )
    : 0
  return todayKey !== lastKey
}

export function buildActivityUpdate(activityLog = [], now = new Date()) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last = activityLog[activityLog.length - 1]
  if (last && new Date(last.date).getTime() === day.getTime()) {
    return {
      inc: { 'activityLog.$[day].reviews': 1 },
      arrayFilters: [{ 'day.date': day }],
    }
  }
  return {
    push: { activityLog: { $each: [{ date: day, reviews: 1 }], $slice: -MAX_ACTIVITY_DAYS } },
  }
}

// Writes are ordered progress -> user -> badges. Each write is a single atomic
// update; a failure after progress leaves the review recorded but its reward
// ungranted (an under-count, never corruption), and missing badges are awarded
// on a later review. No transaction: this also works on standalone mongod.
router.post('/review', requireDB, requireAuth, reviewLimiter, async (req, res) => {
  try {
    const { wordId, correct, mode } = req.body || {}
    if (!wordId || !mongoose.isValidObjectId(wordId)) {
      return res.status(400).json({ message: 'Valid wordId is required' })
    }
    if (typeof correct !== 'boolean') {
      return res.status(400).json({ message: 'correct must be a boolean' })
    }
    if (mode !== undefined && !['practice', 'quiz', 'typing'].includes(mode)) {
      return res.status(400).json({ message: "mode must be one of: 'practice', 'quiz', 'typing'" })
    }

    const word = await Word.findById(wordId)
    if (!word) return res.status(404).json({ message: 'Word not found' })

    const now = new Date()
    let existing
    try {
      existing = await Progress.findOneAndUpdate(
        { userId: req.user._id, wordId },
        { $setOnInsert: { userId: req.user._id, wordId, status: 'new', box: 1, streakCorrect: 0 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err
      existing = await Progress.findOne({ userId: req.user._id, wordId })
      if (!existing) throw err
    }

    const before = existing.status
    const next = nextReviewState(existing, correct)
    const entry = { at: now, correct, box: next.box, mode: mode || 'practice' }
    const progress = await Progress.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: next,
        $push: { history: { $each: [entry], $slice: -MAX_HISTORY_ENTRIES } },
      },
      { new: true }
    )

    const user = await User.findById(req.user._id)
    if (!user) return res.json({ progress })

    const xpGained = xpForAnswer(correct, next.box)
    const prevLevel = user.level || 1
    const priorFreezes = user.streakFreezes

    user.xp = (user.xp || 0) + xpGained
    user.totalReviewed = (user.totalReviewed || 0) + 1
    if (correct) user.totalCorrect = (user.totalCorrect || 0) + 1

    const needsReset = needsReviewsTodayReset(user.reviewsTodayDate, now)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    user.reviewsToday = needsReset ? 1 : (user.reviewsToday || 0) + 1
    user.reviewsTodayDate = now

    const streak = applyDailyStreak(user, now)
    user.practiceStreakDays = streak.dailyStreak
    user.lastPracticeDate = now

    const goal = awardGoalRefill(user, now)

    const newLevel = levelFor(user.xp)
    const levelUp = newLevel > prevLevel
    user.level = newLevel
    user.perfectRun = correct ? (user.perfectRun || 0) + 1 : 0

    const inc = { xp: xpGained, totalReviewed: 1 }
    if (correct) inc.totalCorrect = 1
    if (goal.freezeRefilled) inc.goalsMet = 1
    const set = {
      level: newLevel,
      practiceStreakDays: streak.dailyStreak,
      lastPracticeDate: now,
      perfectRun: user.perfectRun,
    }
    if (user.streakFreezes !== priorFreezes) set.streakFreezes = user.streakFreezes
    if (goal.freezeRefilled) set.goalMetDate = user.goalMetDate

    const activity = buildActivityUpdate(user.activityLog, now)
    if (activity.inc) Object.assign(inc, activity.inc)
    const update = { $inc: inc, $set: set }
    if (activity.push) update.$push = activity.push
    const options = { new: true }
    if (activity.arrayFilters) options.arrayFilters = activity.arrayFilters
    await User.findOneAndUpdate({ _id: req.user._id }, update, options)

    let reviewsTodayDoc = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        $or: [{ reviewsTodayDate: { $gte: todayStart } }, { reviewsTodayDate: null }],
      },
      { $inc: { reviewsToday: 1 }, $set: { reviewsTodayDate: now } },
      { new: true }
    )
    if (!reviewsTodayDoc) {
      reviewsTodayDoc = await User.findOneAndUpdate(
        { _id: req.user._id, reviewsTodayDate: { $lt: todayStart } },
        { $set: { reviewsToday: 1, reviewsTodayDate: now } },
        { new: true }
      )
    }
    if (!reviewsTodayDoc) {
      reviewsTodayDoc = await User.findOneAndUpdate(
        { _id: req.user._id, reviewsTodayDate: { $gte: todayStart } },
        { $inc: { reviewsToday: 1 } },
        { new: true }
      )
    }

    const newBadges = []
    for (const badge of awardBadges(user, now)) {
      const res = await User.updateOne(
        { _id: req.user._id, 'badges.id': { $ne: badge.id } },
        { $push: { badges: { id: badge.id, awardedAt: now } } }
      )
      if (res.modifiedCount === 1) newBadges.push(badge)
    }

    const newWordsLearned = before !== 'learning' && before !== 'mastered' && next.status === 'learning' ? 1 : 0
    const reviewsCaughtUp = next.status === 'mastered' && before !== 'mastered' ? 1 : 0

    res.json({
      progress,
      gamification: {
        xpEarned: xpGained,
        xp: user.xp,
        level: newLevel,
        levelUp,
        dailyStreak: user.practiceStreakDays,
        streakIncreased: streak.streakIncreased,
        freezeUsed: streak.freezeUsed,
        streakFreezes: user.streakFreezes || 0,
        dailyGoalMet: goal.goalMet,
        freezeRefilled: goal.freezeRefilled,
        newWordsLearned,
        reviewsCaughtUp,
        reviewsToday: reviewsTodayDoc?.reviewsToday ?? user.reviewsToday,
        dailyGoalTarget: user.dailyGoalTarget || 10,
        newBadges,
      },
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
