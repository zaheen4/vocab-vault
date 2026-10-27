import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'unit-test-jwt-secret-key-12345'

describe('tokenVersion revocation logic', () => {
  it('signs token with tokenVersion and verifies matching version', () => {
    const user = { _id: '507f1f77bcf86cd799439011', role: 'user', tokenVersion: 2 }
    const token = jwt.sign(
      { sub: user._id, role: user.role, v: user.tokenVersion },
      TEST_SECRET,
      { expiresIn: '1d', issuer: 'vocabvault', audience: 'vocabvault-web' }
    )

    const payload = jwt.verify(token, TEST_SECRET, {
      issuer: 'vocabvault',
      audience: 'vocabvault-web',
    })

    expect(payload.v).toBe(2)
    expect((payload.v ?? 0) === (user.tokenVersion ?? 0)).toBe(true)
  })

  it('rejects stale token when user tokenVersion has incremented', () => {
    const userAtLogin = { _id: '507f1f77bcf86cd799439011', role: 'user', tokenVersion: 0 }
    const token = jwt.sign(
      { sub: userAtLogin._id, role: userAtLogin.role, v: userAtLogin.tokenVersion },
      TEST_SECRET,
      { expiresIn: '1d', issuer: 'vocabvault', audience: 'vocabvault-web' }
    )

    const payload = jwt.verify(token, TEST_SECRET, {
      issuer: 'vocabvault',
      audience: 'vocabvault-web',
    })

    // User changes password or revokes all sessions -> tokenVersion becomes 1
    const userAfterRevoke = { ...userAtLogin, tokenVersion: 1 }
    const isValid = (payload.v ?? 0) === (userAfterRevoke.tokenVersion ?? 0)
    expect(isValid).toBe(false)
  })

  it('accepts legacy tokens without v claim if user tokenVersion is 0', () => {
    const legacyToken = jwt.sign(
      { sub: '507f1f77bcf86cd799439011', role: 'user' },
      TEST_SECRET,
      { expiresIn: '1d', issuer: 'vocabvault', audience: 'vocabvault-web' }
    )

    const payload = jwt.verify(legacyToken, TEST_SECRET, {
      issuer: 'vocabvault',
      audience: 'vocabvault-web',
    })

    const user = { tokenVersion: 0 }
    expect((payload.v ?? 0) === (user.tokenVersion ?? 0)).toBe(true)
  })
})

describe('password reset token crypto', () => {
  it('generates 32-byte hex token and produces repeatable SHA-256 hash', () => {
    const rawToken = crypto.randomBytes(32).toString('hex')
    expect(rawToken.length).toBe(64)

    const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex')
    const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(rawToken)
    expect(hash1.length).toBe(64)
  })

  it('different raw tokens produce distinct hashes', () => {
    const tokenA = crypto.randomBytes(32).toString('hex')
    const tokenB = crypto.randomBytes(32).toString('hex')

    const hashA = crypto.createHash('sha256').update(tokenA).digest('hex')
    const hashB = crypto.createHash('sha256').update(tokenB).digest('hex')

    expect(hashA).not.toBe(hashB)
  })
})

describe('brute force lockout window logic', () => {
  it('calculates lock expiration correctly', () => {
    const now = Date.now()
    const lockWindowMs = 15 * 60 * 1000
    const lockUntil = new Date(now + lockWindowMs)

    expect(lockUntil.getTime()).toBeGreaterThan(now)
    const minutesLeft = Math.ceil((lockUntil.getTime() - now) / (60 * 1000))
    expect(minutesLeft).toBe(15)
  })
})
