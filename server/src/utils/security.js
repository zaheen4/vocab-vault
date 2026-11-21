export const MAX_EMAIL_LENGTH = 254
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128
export const MAX_QUERY_LENGTH = 100

const DEV_CLIENT_ORIGIN = 'http://localhost:5173'

export function resolveClientOrigin(env = process.env) {
  const configured = [env.CLIENT_URL, env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  if (configured.length) return configured[0]
  return env.NODE_ENV === 'production' ? null : DEV_CLIENT_ORIGIN
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function isValidEmail(email) {
  return (
    typeof email === 'string' &&
    email.length > 0 &&
    email.length <= MAX_EMAIL_LENGTH &&
    EMAIL_RE.test(email)
  )
}

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parsePagination(query, { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = {}) {
  const rawPage = Number.parseInt(query?.page, 10)
  const rawLimit = Number.parseInt(query?.limit, 10)
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), 10000) : defaultPage
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), maxLimit)
    : defaultLimit
  return { page, limit }
}

export function isDuplicateKeyError(err) {
  return err?.code === 11000
}

export function isCastError(err) {
  return err?.name === 'CastError'
}

export function toSafeMessage(err, fallback = 'Server error') {
  if (!err) return fallback
  if (err.status && err.status < 500 && typeof err.message === 'string') return err.message
  if (err.name === 'ValidationError' && typeof err.message === 'string') return err.message
  if (isCastError(err)) return 'Invalid id'
  if (isDuplicateKeyError(err)) return 'Already exists'
  return fallback
}
