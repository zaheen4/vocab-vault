import { afterEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import { apiLimiter, authLimiter, makeLimiter, reviewLimiter } from './rateLimit.js'

// Boots a one-route app on an ephemeral port. The limiter keys on req.ip, so
// every request in a case shares one bucket — exactly like a local dev run,
// where the whole E2E suite arrives from 127.0.0.1.
async function boot(limiter) {
  const app = express()
  app.get('/ping', limiter, (req, res) => res.json({ ok: true }))
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  return {
    async hit(count = 1) {
      const responses = []
      for (let i = 0; i < count; i += 1) {
        responses.push(await fetch(`http://127.0.0.1:${port}/ping`))
      }
      return responses
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

afterEach(() => vi.unstubAllEnvs())

describe('rate limiters', () => {
  it('returns 429 once a production client exceeds its ceiling', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const app = await boot(makeLimiter({ limit: 2, message: 'slow down' }))
    try {
      const responses = await app.hit(3)
      expect(responses.map((r) => r.status)).toEqual([200, 200, 429])
      expect(await responses[2].json()).toEqual({ message: 'slow down' })
    } finally {
      await app.close()
    }
  })

  it('never throttles outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const app = await boot(makeLimiter({ limit: 2, message: 'slow down' }))
    try {
      const responses = await app.hit(5)
      expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200])
      // Skipped limiters write no headers at all, so nothing is even counted.
      expect(responses[4].headers.get('ratelimit-policy')).toBeNull()
    } finally {
      await app.close()
    }
  })

  it('keeps the ceilings documented in API_CONTRACT in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const documented = [
      [authLimiter, 30],
      [reviewLimiter, 200],
      [apiLimiter, 1000],
    ]
    for (const [limiter, limit] of documented) {
      const app = await boot(limiter)
      try {
        const [response] = await app.hit()
        expect(response.headers.get('ratelimit-policy')).toContain(`q=${limit}`)
      } finally {
        await app.close()
      }
    }
  })
})
