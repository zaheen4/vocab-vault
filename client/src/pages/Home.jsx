import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

const badgeClass = {
  basic: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

function DeckCard({ deck }) {
  const count = deck.wordCount ?? (deck.wordIds ? deck.wordIds.length : 0)
  return (
    <Card hoverable className="relative flex h-full flex-col p-5 shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-primary">{deck.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass[deck.difficulty] || 'bg-slate-100 text-slate-600'}`}
        >
          {deck.difficulty}
        </span>
      </div>
      {deck.description && (
        <p className="mt-1 text-sm text-slate-500">{deck.description}</p>
      )}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500">{count} words</p>
          <Link
            to={`/decks/${deck._id}/quiz`}
            className="relative z-10 rounded-full bg-accent px-4 py-3 text-xs font-bold text-primary hover:brightness-95"
          >
            Quiz →
          </Link>
        </div>
      </div>
      {/* stretched link: whole card goes to Practice, Quiz pill sits above it */}
      <Link
        to={`/decks/${deck._id}`}
        aria-label={`Practice ${deck.title}`}
        className="absolute inset-0 rounded-lg"
      />
    </Card>
  )
}

export default function Home() {
  const [decks, setDecks] = useState([])
  const [stats, setStats] = useState(null)
  const [summary, setSummary] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    api
      .get('/decks')
      .then((data) => {
        if (cancelled) return
        setDecks(data.decks)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setStatus('error')
      })
    // Hero stats and pipeline counts are decorative — never block or break the page
    api
      .get('/gamification/me')
      .then((data) => !cancelled && setStats(data.gamification))
      .catch(() => {})
    api
      .get('/progress/summary')
      .then((data) => !cancelled && setSummary(data.summary))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        Failed to load decks.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <EmptyState
        title="No decks yet"
        message="Decks will appear here once your administrator adds them."
      />
    )
  }

  const totalProgress = summary
    ? Object.values(summary).reduce((a, b) => a + b, 0)
    : null

  return (
    <div className="-m-4 sm:-m-6">
      <div className="bg-primary px-4 pb-28 pt-6 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">VocabVault</p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Master your words.</h1>
        {stats && (
          <div className="mt-3 flex gap-6 text-sm">
            {stats.dailyStreak > 0 && (
              <span className="font-semibold text-gold">🔥 {stats.dailyStreak} day streak</span>
            )}
            <span className="font-semibold text-gold">⭐ Level {stats.level}</span>
            <span className="font-semibold text-gold">+{stats.xp} XP</span>
          </div>
        )}
      </div>
      <div className="-mt-24 bg-gold/40 px-4 pb-10 pt-12 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck, i) => (
            <div
              key={deck._id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <DeckCard deck={deck} />
            </div>
          ))}
        </div>

        {/* First-run guidance only: vanishes once the user has any progress */}
        {totalProgress === 0 && decks[0] && (
          <Link
            to={`/decks/${decks[0]._id}`}
            className="mt-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow"
          >
            <div>
              <p className="text-sm font-semibold text-primary">
                Start with {decks[0].title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Flip through your first cards — reviews get scheduled automatically.
              </p>
            </div>
            <span className="ml-auto shrink-0 text-lg font-bold text-accent">→</span>
          </Link>
        )}
      </div>
    </div>
  )
}
