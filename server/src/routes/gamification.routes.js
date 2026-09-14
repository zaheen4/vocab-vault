import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { levelFor, xpProgress } from '../utils/gamify.js'

const GOAL_TARGETS = [5, 10, 15, 20, 25, 30, 40, 50]

const router = Router()

router.get('/me', requireDB, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const level = user.level || levelFor(user.xp || 0)
    res.json({
      gamification: {
        xp: user.xp || 0,
        level,
        dailyStreak: user.practiceStreakDays || 0,
        totalCorrect: user.totalCorrect || 0,
        totalReviewed: user.totalReviewed || 0,
        nextLevelXp: xpProgress(level, user.xp || 0).next,
        progressToNext: xpProgress(level, user.xp || 0).progress,
        streakFreezes: user.streakFreezes || 0,
        dailyGoalTarget: user.dailyGoalTarget || 10,
        reviewsToday: user.reviewsToday || 0,
        goalsMet: user.goalsMet || 0,
        badges: (user.badges || []).map((b) => ({
          id: b.id,
          awardedAt: b.awardedAt || null,
        })),
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
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
    res.status(500).json({ message: err.message })
  }
})

export default router
