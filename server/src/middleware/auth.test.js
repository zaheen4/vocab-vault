import { beforeEach, describe, expect, it, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAdmin, requireAuth } from './auth.js'

vi.mock('../models/User.js', () => ({
  default: { findById: vi.fn() },
}))

const SECRET = 'auth-middleware-test-secret'
const USER_ID = '507f1f77bcf86cd799439011'
process.env.JWT_SECRET = SECRET

function reqWith(header) {
  return { headers: header ? { authorization: header } : {} }
}

function makeRes() {
  const res = {}
  res.status = vi.fn((code) => {
    res.statusCode = code
    return res
  })
  res.json = vi.fn((body) => {
    res.body = body
    return res
  })
  return res
}

function makeUser(overrides = {}) {
  return { _id: USER_ID, role: 'user', tokenVersion: 0, ...overrides }
}

function mockLookup(user) {
  const select = vi.fn().mockResolvedValue(user)
  User.findById.mockReturnValue({ select })
  return select
}

function token(claims = {}, options = {}) {
  return jwt.sign({ sub: USER_ID, ...claims }, options.secret ?? SECRET, {
    algorithm: options.algorithm ?? 'HS256',
    issuer: options.issuer ?? 'vocabvault',
    audience: options.audience ?? 'vocabvault-web',
    expiresIn: options.expiresIn ?? '1h',
  })
}

async function runAuth(header) {
  const req = reqWith(header)
  const res = makeRes()
  const next = vi.fn()
  await requireAuth(req, res, next)
  return { req, res, next }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('rejects a missing Authorization header with 401', async () => {
    const { res, next } = await runAuth()
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Authentication required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects a header without the Bearer prefix with 401', async () => {
    const { res, next } = await runAuth(token())
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Authentication required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects a token signed with the wrong secret with 401', async () => {
    const bad = token({}, { secret: 'wrong-secret' })
    const { res, next } = await runAuth(`Bearer ${bad}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects an HS512 token with 401 (algorithm is pinned to HS256)', async () => {
    const bad = token({}, { algorithm: 'HS512' })
    const { res, next } = await runAuth(`Bearer ${bad}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects a token with the wrong issuer with 401', async () => {
    const bad = token({}, { issuer: 'another-app' })
    const { res } = await runAuth(`Bearer ${bad}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid or expired token' })
  })

  it('rejects a token with the wrong audience with 401', async () => {
    const bad = token({}, { audience: 'another-app' })
    const { res } = await runAuth(`Bearer ${bad}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid or expired token' })
  })

  it('rejects an expired token with 401', async () => {
    const bad = token({}, { expiresIn: '-1h' })
    const { res } = await runAuth(`Bearer ${bad}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid or expired token' })
  })

  it('rejects a stale v claim with 401 and a session-invalidated message', async () => {
    mockLookup(makeUser({ tokenVersion: 1 }))
    const { res, next } = await runAuth(`Bearer ${token({ v: 0 })}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'Session expired or invalidated' })
    expect(next).not.toHaveBeenCalled()
  })

  it('accepts a legacy token without v when tokenVersion is 0', async () => {
    mockLookup(makeUser())
    const { res, next } = await runAuth(`Bearer ${token()}`)
    expect(res.statusCode).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 503 when the user lookup rejects', async () => {
    User.findById.mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error('database down')),
    })
    const { res, next } = await runAuth(`Bearer ${token()}`)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ message: 'Service temporarily unavailable' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when the user no longer exists', async () => {
    mockLookup(null)
    const { res, next } = await runAuth(`Bearer ${token()}`)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ message: 'User no longer exists' })
    expect(next).not.toHaveBeenCalled()
  })

  it('sets req.user and calls next for a valid token and matching user', async () => {
    const user = makeUser({ tokenVersion: 2 })
    const select = mockLookup(user)
    const { req, res, next } = await runAuth(`Bearer ${token({ v: 2 })}`)
    expect(User.findById).toHaveBeenCalledWith(USER_ID)
    expect(select).toHaveBeenCalledWith('-passwordHash')
    expect(req.user).toBe(user)
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })
})

describe('requireAdmin', () => {
  it('rejects a non-admin with 403', () => {
    const req = { user: makeUser({ role: 'user' }) }
    const res = makeRes()
    const next = vi.fn()
    requireAdmin(req, res, next)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ message: 'Admin access required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next for an admin', () => {
    const req = { user: makeUser({ role: 'admin' }) }
    const res = makeRes()
    const next = vi.fn()
    requireAdmin(req, res, next)
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })
})
