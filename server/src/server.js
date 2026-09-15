import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB, dbReady } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import deckRoutes from './routes/decks.routes.js'
import wordRoutes from './routes/words.routes.js'
import progressRoutes from './routes/progress.routes.js'
import gamificationRoutes from './routes/gamification.routes.js'
import bookmarksRoutes from './routes/bookmarks.routes.js'
import listsRoutes from './routes/lists.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { apiLimiter } from './middleware/rateLimit.js'

const app = express()
// Behind Render's proxy: trust the first hop so rate-limit keys and
// secure cookies (if added later) see the real client IP.
app.set('trust proxy', 1)
app.use(helmet())
app.disable('x-powered-by')

// CORS: fail closed in production — a missing CLIENT_URL must never silently
// become allow-all. Local dev (NODE_ENV unset) stays open for Vite.
const isProd = process.env.NODE_ENV === 'production'
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((o) => o.startsWith('http://') || o.startsWith('https://'))
if (isProd && allowedOrigins.length === 0) {
  throw new Error('[server] CLIENT_URL is required in production — refusing to boot with open CORS')
}
app.use(
  allowedOrigins.length > 0
    ? cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
      })
    : cors()
)
app.use(express.json({ limit: '100kb' }))
app.use('/api', apiLimiter)

// Fail fast in production: without a secret every auth request 500s anyway,
// so refuse to boot instead of serving a half-dead API.
if (!process.env.JWT_SECRET) {
  if (isProd) throw new Error('[server] JWT_SECRET is required — refusing to boot')
  console.warn('[server] JWT_SECRET not set — auth endpoints will fail')
}

const DEPLOY_SHA = (process.env.RENDER_GIT_COMMIT || process.env.SOURCE_VERSION || 'dev').slice(0, 7)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), db: dbReady(), deploy: DEPLOY_SHA })
})

app.use('/api/auth', authRoutes)
app.use('/api/decks', deckRoutes)
app.use('/api/words', wordRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/bookmarks', bookmarksRoutes)
app.use('/api/lists', listsRoutes)
app.use('/api/admin', adminRoutes)

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Central error handler: never leak stack traces or Mongo internals.
// Operational (4xx) messages pass through; everything else is generic.
app.use((err, req, res, next) => {
  console.error('[error]', err?.message)
  const status = err?.status && Number.isInteger(err.status) ? err.status : 500
  const message = status < 500 && err?.message ? err.message : 'Server error'
  res.status(status).json({ message })
})

const PORT = process.env.PORT || 5000

await connectDB()
app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`))
