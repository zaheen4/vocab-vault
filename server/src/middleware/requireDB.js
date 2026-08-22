import { dbReady } from '../config/db.js'

// Returns 503 with a clear message when the database is unreachable,
// instead of an unhandled 500 from mongoose.
export function requireDB(req, res, next) {
  if (!dbReady()) {
    return res.status(503).json({
      message: 'Database not connected — set MONGODB_URI in server/.env and restart',
    })
  }
  next()
}
