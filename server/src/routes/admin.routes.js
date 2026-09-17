import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'

const router = Router()

// Bulk import cut from sprint scope — only the admin ping lives here.
router.use(requireAuth, requireAdmin)

router.get('/ping', requireDB, (req, res) => {
  res.json({ message: `admin ok for ${req.user.email}` })
})

export default router
