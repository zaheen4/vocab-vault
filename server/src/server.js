import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import deckRoutes from './routes/decks.routes.js'
import wordRoutes from './routes/words.routes.js'
import progressRoutes from './routes/progress.routes.js'
import gamificationRoutes from './routes/gamification.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/api/auth', authRoutes)
app.use('/api/decks', deckRoutes)
app.use('/api/words', wordRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/gamification', gamificationRoutes)
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
