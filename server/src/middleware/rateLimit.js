import { rateLimit } from 'express-rate-limit'

// Shared limiters. Generous ceilings so normal study flows never trip them;
// they exist to blunt brute-force and farming bots.
//
// Production only. Locally and in the E2E suite every request arrives from one
// IP, so a 15-minute window of 1000 requests turned repeat runs into 429s
// until the dev server restarted — friction that protected nothing, because
// local and CI traffic is trusted. A deployed instance keeps every ceiling.
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
