import { rateLimit } from 'express-rate-limit'

// Shared limiters. Generous ceilings so normal study flows and the E2E
// suites never trip them; they exist to blunt brute-force and farming bots.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many auth attempts — try again in a few minutes' },
})

export const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many reviews — slow down a little' },
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests — try again shortly' },
})
