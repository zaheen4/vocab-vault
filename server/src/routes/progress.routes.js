import { Router } from 'express'
import Progress from '../models/Progress.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Leitner box intervals (days): review due after this long in each box
export const BOX_INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 }

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const byStatus = await Progress.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    res.json({
      summary: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
