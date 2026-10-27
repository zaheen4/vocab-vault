import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Progress from '../models/Progress.js'
import QuizSession from '../models/QuizSession.js'
import Bookmark from '../models/Bookmark.js'
import CustomList from '../models/CustomList.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { sendPasswordResetEmail } from '../utils/mailer.js'
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
  issuer: 'vocabvault',
  audience: 'vocabvault-web',
}

const sign = (user, rememberMe = false) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, v: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    {
      ...JWT_OPTIONS,
      expiresIn: rememberMe ? '30d' : '1d',
    }
  )

// Never expose the password hash or reset token hashes: auth responses carry the public profile only.
function publicUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user }
  delete obj.passwordHash
  delete obj.resetPasswordTokenHash
  delete obj.resetPasswordExpires
  delete obj.failedLoginAttempts
  delete obj.lockUntil
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
    const { email, password, rememberMe } = req.body || {}
    const invalid = validateCredentials({ email, password })
    if (invalid) return res.status(401).json({ message: 'Invalid email or password' })
    if (typeof password !== 'string') {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const cleanEmail = normalizeEmail(email)
    const user = await User.findOne({ email: cleanEmail })

    if (user?.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000))
      return res.status(423).json({
        message: `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      })
    }

    const match = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !match) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        }
        await user.save()
      }
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0
      user.lockUntil = undefined
      await user.save()
    }

    res.json({ token: sign(user, Boolean(rememberMe)), user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/forgot-password', requireDB, authLimiter, async (req, res) => {
  try {
    const { email } = req.body || {}
    const cleanEmail = normalizeEmail(email)
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Valid email is required' })
    }

    const user = await User.findOne({ email: cleanEmail })
    let devResetUrl = null

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      user.resetPasswordTokenHash = tokenHash
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000)
      await user.save()

      const origin = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173'
      const resetUrl = `${origin}/reset-password?token=${rawToken}`
      await sendPasswordResetEmail({ email: cleanEmail, resetUrl })

      if (process.env.NODE_ENV !== 'production') {
        devResetUrl = resetUrl
      }
    }

    res.json({
      message: 'If that email is registered, password reset instructions have been sent.',
      ...(devResetUrl && { devResetUrl }),
    })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/reset-password', requireDB, authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body || {}
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Reset token is required' })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired' })
    }

    user.passwordHash = await bcrypt.hash(password, 12)
    user.resetPasswordTokenHash = undefined
    user.resetPasswordExpires = undefined
    user.failedLoginAttempts = 0
    user.lockUntil = undefined
    user.tokenVersion = (user.tokenVersion || 0) + 1
    await user.save()

    res.json({ ok: true, message: 'Password reset successful. Please log in with your new password.' })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.patch('/profile', requireDB, requireAuth, async (req, res) => {
  try {
    const { name } = req.body || {}
    const cleanName = typeof name === 'string' ? name.trim() : ''
    if (!cleanName) return res.status(400).json({ message: 'Name is required' })
    if (cleanName.length > 100) return res.status(400).json({ message: 'Name must be at most 100 characters' })

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.name = cleanName
    await user.save()
    res.json({ user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.patch('/password', requireDB, requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ message: 'Current password is required' })
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` })
    }

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    user.tokenVersion = (user.tokenVersion || 0) + 1
    await user.save()

    const token = sign(user, false)
    res.json({ ok: true, token, user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/revoke-all', requireDB, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.tokenVersion = (user.tokenVersion || 0) + 1
    await user.save()
    res.json({ ok: true, message: 'All other sessions have been revoked' })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/reset-progress', requireDB, requireAuth, async (req, res) => {
  try {
    const { password } = req.body || {}
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password confirmation is required' })
    }

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    await Promise.all([
      Progress.deleteMany({ userId: user._id }),
      QuizSession.deleteMany({ userId: user._id }),
    ])

    user.xp = 0
    user.level = 1
    user.totalCorrect = 0
    user.totalReviewed = 0
    user.lastPracticeDate = undefined
    user.practiceStreakDays = 0
    user.streakFreezes = 1
    user.reviewsToday = 0
    user.reviewsTodayDate = undefined
    user.goalMetDate = undefined
    user.goalsMet = 0
    user.activityLog = []
    user.badges = []
    user.perfectRun = 0
    await user.save()

    res.json({ ok: true, user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.delete('/account', requireDB, requireAuth, async (req, res) => {
  try {
    const { password } = req.body || {}
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password confirmation is required' })
    }

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    await Promise.all([
      Progress.deleteMany({ userId: user._id }),
      QuizSession.deleteMany({ userId: user._id }),
      Bookmark.deleteMany({ userId: user._id }),
      CustomList.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id),
    ])

    res.json({ ok: true, message: 'Account permanently deleted' })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/logout', requireDB, requireAuth, (req, res) => {
  res.json({ ok: true })
})

router.get('/me', requireDB, requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router
