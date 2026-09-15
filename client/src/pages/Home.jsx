import { Link } from 'react-router-dom'
import { usePrefetchDeck, useDecks, useGamification, useProgressSummary } from '../api/queries'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import DeckTile from '../components/DeckTile'
import EmptyArt from '../components/art/EmptyArt'
import { FlameIcon, StarIcon } from '../components/art/icons'

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
      <div className="flex items-center gap-3">
        <DeckTile id={deck._id} title={deck.title} />
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
  const started = totalProgress > 0

  return (
    <div className="animate-page -m-4 sm:-m-6">
      <div className="bg-gradient-to-br from-primary via-primary to-night-800 px-4 pt-6 pb-28 sm:px-6 dark:border-b dark:border-white/10 dark:from-night-900 dark:via-night-900 dark:to-night-950">
        <p className="font-display text-xs font-bold tracking-widest text-accent uppercase">VocabVault</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl dark:text-cream-100">Master your words.</h1>
        <p className="mt-1 max-w-md text-sm text-white/70 dark:text-cream-300/80">
          GRE words on a schedule that adapts to you — flip cards, quiz yourself, and watch the streak grow.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {firstDeck && (
            <Link to={`/decks/${firstDeck._id}`}>
              <Button className="shadow-lg">
                {started ? 'Continue practicing →' : `Start with ${firstDeck.title} →`}
              </Button>
            </Link>
          )}
          {stats && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <FlameIcon size={14} className="text-accent" /> {stats.dailyStreak}d
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <StarIcon size={14} className="text-accent" /> Lv {stats.level}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                +{stats.xp} XP
              </span>
            </div>
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
      </div>
    </div>
  )
}
