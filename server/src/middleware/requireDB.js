import { dbReady } from '../config/db.js'

// Returns 503 with a generic message when the database is unreachable,
// instead of an unhandled 500 from mongoose. Internal setup details
// (env names, file paths) never go to clients.
export function requireDB(req, res, next) {
  if (!dbReady()) {
    return res.status(503).json({ message: 'Service temporarily unavailable' })
  }
  next()
}
