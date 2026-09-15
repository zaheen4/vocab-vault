import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { authLimiter } from '../middleware/rateLimit.js'
import {
  MAX_PASSWORD_LENGTH,
  isDuplicateKeyError,
  isValidEmail,
  normalizeEmail,
  toSafeMessage,
} from '../utils/security.js'

const router = Router()

const JWT_OPTIONS = {
  algorithm: 'HS256',
  expiresIn: '1d',
  issuer: 'vocabvault',
  audience: 'vocabvault-web',
}

const sign = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, JWT_OPTIONS)

// Never expose the password hash: auth responses carry the user profile only.
function publicUser(user) {
  const obj = user.toObject()
  delete obj.passwordHash
  return obj
}

function validateCredentials({ name, email, password }, { requireName = false } = {}) {
  if (requireName) {
    const cleanName = typeof name === 'string' ? name.trim() : ''
    if (!cleanName) return 'name is required'
    if (cleanName.length > 100) return 'name must be at most 100 characters'
  }
  const cleanEmail = normalizeEmail(email)
  if (!cleanEmail) return 'email is required'
  if (!isValidEmail(cleanEmail)) return 'valid email is required'
  if (typeof password !== 'string' || !password) return 'password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  // bcrypt truncates past 72 bytes and huge inputs burn CPU; cap well above
  // any legitimate password while keeping hashing cost predictable.
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
  }
  return null
}

router.post('/register', requireDB, authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    const invalid = validateCredentials({ name, email, password }, { requireName: true })
    if (invalid) return res.status(400).json({ message: invalid })

    const cleanEmail = normalizeEmail(email)
    const exists = await User.findOne({ email: cleanEmail })
    // Generic conflict message: avoids confirming which emails are registered.
    if (exists) return res.status(409).json({ message: 'Unable to create account' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name: name.trim(), email: cleanEmail, passwordHash })
    res.status(201).json({ token: sign(user), user: publicUser(user) })
  } catch (err) {
    // Check-then-act race: a concurrent register wins the unique index.
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: 'Unable to create account' })
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/login', requireDB, authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const invalid = validateCredentials({ email, password })
    // Keep the failure shape identical for bad input vs bad credentials so
    // input errors don't become an enumeration oracle.
    if (invalid) return res.status(401).json({ message: 'Invalid email or password' })
    if (typeof password !== 'string') {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = await User.findOne({ email: normalizeEmail(email) })
    // Constant-shape failure: bcrypt.compare only runs when a user exists,
    // but the response (status + message + timing bucket) must not reveal more.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.json({ token: sign(user), user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

// Stateless logout acknowledgement. Tokens are short-lived bearer tokens the
// client discards + clears from cache; this endpoint exists so logout is an
// explicit, auditable API call and a future revocation list has a hook.
router.post('/logout', requireDB, requireAuth, (req, res) => {
  res.json({ ok: true })
})

router.get('/me', requireDB, requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router
