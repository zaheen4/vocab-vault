import { Link } from 'react-router-dom'
import { usePrefetchDeck, useDecks, useGamification, useProgressSummary } from '../api/queries'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import { pickSeeded } from '../components/art/seed.js'

// Seeded tile tints (owner call: covers removed, color carries the card).
const TILE_STYLES = [
  'bg-accent/15 text-accent-deep dark:bg-accent/20 dark:text-accent',
  'bg-gold text-accent-deep dark:bg-gold/15 dark:text-gold',
  'bg-primary/10 text-primary dark:bg-white/10 dark:text-cream-100',
  'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
]

function DeckCard({ deck }) {
  const count = deck.wordCount ?? (deck.wordIds ? deck.wordIds.length : 0)
  const prefetchDeck = usePrefetchDeck()
  const warm = () => prefetchDeck(deck._id)
  const tile = pickSeeded(TILE_STYLES, deck._id) ?? TILE_STYLES[0]
  return (
    <Card
      hoverable
      className="relative flex h-full flex-col border-2 p-5 shadow-md"
      onMouseEnter={warm}
      onFocus={warm}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-xl font-bold ${tile}`}
        >
          {(deck.title || '?').trim().charAt(0).toUpperCase()}
        </span>
        <h3 className="font-display text-lg font-bold text-primary dark:text-cream-100">{deck.title}</h3>
      </div>
      <div className="mt-auto pt-4">
        <p className="border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-cream-300/80">
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
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-night-800" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
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
        art={<EmptyArt variant="decks" />}
        title="No decks yet"
        message="Decks will appear here once your administrator adds them."
      />
    )
  }

  const totalProgress = summary
    ? Object.values(summary).reduce((a, b) => a + b, 0)
    : null

  // Group decks in numeric order; decks without a group sink to the end.
  // First-run guidance always starts at Group 1 when it exists.
  const sorted = [...decks].sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
  const firstDeck = sorted.find((d) => d.group === 1) ?? sorted[0]

  return (
    <div className="animate-page -m-4 sm:-m-6">
      <div className="bg-primary px-4 pt-6 pb-28 sm:px-6 dark:border-b dark:border-white/10 dark:bg-night-900">
        <p className="font-display text-xs font-bold tracking-widest text-accent uppercase">VocabVault</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl dark:text-cream-100">Master your words.</h1>
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
      <div className="-mt-24 bg-gold/40 px-4 pt-12 pb-10 sm:px-6 dark:bg-night-950">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((deck, i) => (
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
        {totalProgress === 0 && firstDeck && (
          <Link
            to={`/decks/${firstDeck._id}`}
            className="mt-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow active:scale-99 dark:border-white/10 dark:bg-night-900 dark:shadow-none"
          >
            <div>
              <p className="font-display text-sm font-semibold text-primary dark:text-cream-100">
                Start with {firstDeck.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-cream-300/80">
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
