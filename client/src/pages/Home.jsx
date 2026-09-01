import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Card from '../components/ui/Card'

const DIFFICULTIES = ['basic', 'intermediate', 'advanced']

const badgeClass = {
  basic: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

function DeckCard({ deck }) {
  const count = deck.wordCount ?? (deck.wordIds ? deck.wordIds.length : 0)
  return (
    <Link to={`/decks/${deck._id}`} className="block">
      <Card hoverable className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-primary">{deck.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass[deck.difficulty] || 'bg-slate-100 text-slate-600'}`}
          >
            {deck.difficulty}
          </span>
        </div>
        {deck.description && (
          <p className="mt-1 text-sm text-slate-500">{deck.description}</p>
        )}
        <p className="mt-3 text-xs font-medium text-slate-400">{count} words</p>
      </Card>
    </Link>
  )
}

export default function Home() {
  const [decks, setDecks] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    api
      .get('/decks')
      .then((data) => {
        if (!cancelled) {
          setDecks(data.decks)
          setStatus('ready')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err)
          setStatus('error')
        }
      })
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Your decks</h1>
      {DIFFICULTIES.map((level) => {
        const group = decks.filter((d) => d.difficulty === level)
        if (group.length === 0) return null
        return (
          <section key={level}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {level}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((deck) => (
                <DeckCard key={deck._id} deck={deck} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
