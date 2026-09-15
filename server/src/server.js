import express from 'express'
import cors from 'cors'
import { connectDB, dbReady } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import deckRoutes from './routes/decks.routes.js'
import wordRoutes from './routes/words.routes.js'
import progressRoutes from './routes/progress.routes.js'
import gamificationRoutes from './routes/gamification.routes.js'
import bookmarksRoutes from './routes/bookmarks.routes.js'
import listsRoutes from './routes/lists.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()
// CORS: locked to CLIENT_URL (comma-separated) in production so only the
// deployed web app can call the API. Unset locally keeps dev open.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
app.use(allowedOrigins.length > 0 ? cors({ origin: allowedOrigins }) : cors())
app.use(express.json({ limit: '100kb' }))

// Fail loud, not silent: a missing JWT_SECRET only surfaces as confusing
// per-request 500s, so warn at startup (Render generates it via render.yaml).
if (!process.env.JWT_SECRET) {
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

// error handler
app.use((err, req, res, next) => {
  console.error('[error]', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 5000

await connectDB()
app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`))
