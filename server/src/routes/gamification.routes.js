import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { levelFor, xpProgress } from '../utils/gamify.js'
import { toSafeMessage } from '../utils/security.js'

const GOAL_TARGETS = [5, 10, 15, 20, 25, 30, 40, 50]

const router = Router()

router.get('/me', requireDB, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const level = user.level || levelFor(user.xp || 0)
    const progress = xpProgress(level, user.xp || 0)
    res.json({
      gamification: {
        xp: user.xp || 0,
        level,
        dailyStreak: user.practiceStreakDays || 0,
        totalCorrect: user.totalCorrect || 0,
        totalReviewed: user.totalReviewed || 0,
        nextLevelXp: progress.next,
        progressToNext: progress.progress,
        streakFreezes: user.streakFreezes || 0,
        dailyGoalTarget: user.dailyGoalTarget || 10,
        reviewsToday: user.reviewsToday || 0,
        goalsMet: user.goalsMet || 0,
        activity: (user.activityLog || []).slice(-14).map((a) => {
          const d = new Date(a.date)
          const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          return { date: day, reviews: a.reviews || 0 }
        }),
        badges: (user.badges || []).map((b) => ({
          id: b.id,
          awardedAt: b.awardedAt || null,
        })),
      },
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.patch('/goal', requireDB, requireAuth, async (req, res) => {
  try {
    const { target } = req.body || {}
    if (!GOAL_TARGETS.includes(target)) {
      return res.status(400).json({ message: `target must be one of: ${GOAL_TARGETS.join(', ')}` })
    }
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.dailyGoalTarget = target
    await user.save()

    res.json({ dailyGoalTarget: user.dailyGoalTarget })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
