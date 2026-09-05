import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { levelFor, xpProgress } from '../utils/gamify.js'

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
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
