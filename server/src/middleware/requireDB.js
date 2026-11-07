import { dbReady } from '../config/db.js'

export function requireDB(req, res, next) {
  if (!dbReady()) {
    return res.status(503).json({ message: 'Service temporarily unavailable' })
  }
  next()
}
