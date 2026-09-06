import { Link } from 'react-router-dom'
import { usePrefetchDeck, useDecks, useGamification, useProgressSummary } from '../api/queries'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'

const badgeClass = {
  basic: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

function DeckCard({ deck }) {
  const count = deck.wordCount ?? (deck.wordIds ? deck.wordIds.length : 0)
  const prefetchDeck = usePrefetchDeck()
  const warm = () => prefetchDeck(deck._id)
  return (
    <Card
      hoverable
      className="relative flex h-full flex-col border-2 p-5 shadow-md"
      onMouseEnter={warm}
      onFocus={warm}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-primary">{deck.title}</h3>
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
        <p className="border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
          {count} words
        </p>
      </div>
      {/* stretched link: the whole card is the Practice entry; modes live in ModeTabs */}
      <Link
        to={`/decks/${deck._id}`}
        aria-label={`Practice ${deck.title}`}
        className="absolute inset-0 rounded-lg"
      />
    </Card>
  )
}

export default function Home() {
  const { data: decks = [], isLoading, isError } = useDecks()
  // Decorative: never block or break the page on failure
  const { data: stats } = useGamification()
  const { data: summary } = useProgressSummary()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    )
  }

  if (isError) {
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
    <div className="animate-page -m-4 sm:-m-6">
      <div className="bg-primary px-4 pt-6 pb-28 sm:px-6">
        <p className="font-display text-xs font-bold tracking-widest text-accent uppercase">VocabVault</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Master your words.</h1>
        <div className="mt-3 flex min-h-5 items-center gap-6 text-sm">
          {stats && (
            <>
              {stats.dailyStreak > 0 && (
                <span className="font-semibold text-gold">🔥 {stats.dailyStreak} day streak</span>
              )}
              <span className="font-semibold text-gold">⭐ Level {stats.level}</span>
              <span className="font-semibold text-gold">+{stats.xp} XP</span>
            </>
          )}
        </div>
      </div>
      <div className="-mt-24 bg-gold/40 px-4 pt-12 pb-10 sm:px-6">
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
            className="mt-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow active:scale-[0.99]"
          >
            <div>
              <p className="font-display text-sm font-semibold text-primary">
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
