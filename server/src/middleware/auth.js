import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_ALGORITHM = 'HS256'
const JWT_ISSUER = 'vocabvault'
const JWT_AUDIENCE = 'vocabvault-web'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required' })

  // Token errors (bad signature, expired) are 401 — never conflate with DB state.
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  // DB failures here are infrastructure (503), not bad credentials (401).
  let user
  try {
    user = await User.findById(payload.sub).select('-passwordHash')
  } catch {
    return res.status(503).json({ message: 'Service temporarily unavailable' })
  }
  if (!user) return res.status(401).json({ message: 'User no longer exists' })

  req.user = user
  next()
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}
