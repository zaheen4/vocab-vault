import { rateLimit } from 'express-rate-limit'

const WINDOW_MS = 15 * 60 * 1000
const skipOutsideProduction = () => process.env.NODE_ENV !== 'production'

export function makeLimiter({ limit, message }) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: skipOutsideProduction,
    message: { message },
  })
}

export const authLimiter = makeLimiter({
  limit: 30,
  message: 'Too many auth attempts — try again in a few minutes',
})

export const reviewLimiter = makeLimiter({
  limit: 200,
  message: 'Too many reviews — slow down a little',
})

export const apiLimiter = makeLimiter({
  limit: 1000,
  message: 'Too many requests — try again shortly',
})
