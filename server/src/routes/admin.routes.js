import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Placeholder — bulk import (CSV/JSON) and deck CRUD arrive in weeks 8-10
router.use(requireAuth, requireAdmin)

router.get('/ping', (req, res) => {
  res.json({ message: `admin ok for ${req.user.email}` })
})

export default router
