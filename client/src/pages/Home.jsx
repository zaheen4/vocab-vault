import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  usePrefetchDeck,
  useDecks,
  useDueWords,
  useGamification,
  useWeakWords,
} from '../api/queries'
import { filterDecks } from '../utils/deckFilter'
import {
  DECK_STATUS_FILTERS,
  deckAction,
  deckTotals,
  filterDecksByStatus,
  goalProgress,
  nextDeckPart,
  pickContinueDeck,
} from '../utils/homeSections'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import Chip from '../components/ui/Chip'
import EmptyArt from '../components/art/EmptyArt'
import { FlameIcon, StarIcon } from '../components/art/icons'
import { pickSeeded } from '../components/art/seed'
import { TILE_STYLES } from '../components/DeckTile'

const PRIMARY_LINK =
  'inline-flex min-h-11 items-center justify-center rounded-xl border-b-4 border-accent-deep bg-accent px-4 font-display text-sm font-bold text-primary transition-all hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-1 active:border-b-0 dark:text-night-950'
const SECONDARY_LINK =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-card px-4 font-display text-sm font-bold text-ink transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const todayLabel = () =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())

function CatalogTab({ deck }) {
  const style = pickSeeded(TILE_STYLES, deck._id) ?? TILE_STYLES[0]
  const label =
    deck.group != null ? String(deck.group).padStart(2, '0') : '★'
  return (
    <span
      aria-hidden="true"
      className={`absolute -top-3 left-4 rounded-t-md border border-b-0 border-line px-2 pt-1 pb-1.5 font-mono text-3xs font-bold tracking-widest ${style}`}
    >
      {label}
    </span>
  )
}

function DeckCard({ deck }) {
  const totals = deckTotals(deck)
  const action = deckAction(deck)
  const prefetchDeck = usePrefetchDeck()
  const warm = () => prefetchDeck(deck._id)

  return (
    <Card className="relative flex h-full flex-col p-5 pt-6" data-testid="deck-card">
      <CatalogTab deck={deck} />
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/decks/${deck._id}`}
          onMouseEnter={warm}
          onFocus={warm}
          className="group min-w-0"
        >
          <h3 className="truncate font-display text-lg font-bold text-ink group-hover:text-accent-ink">
            {deck.title}
          </h3>
        </Link>
        {totals.reviewDue > 0 && (
          <span className="shrink-0 rounded-sm border border-stamp/40 px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-stamp">
            DUE {totals.reviewDue}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs font-semibold text-ink-muted">
        {totals.count} {totals.count === 1 ? 'word' : 'words'}
        {totals.started && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="text-ink">{totals.pct}% mastered</span>
          </>
        )}
      </p>

      {totals.started && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised"
          role="progressbar"
          aria-valuenow={totals.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${deck.title} mastered`}
        >
          <div
            className="h-full rounded-full bg-sage transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${totals.pct}%` }}
          />
        </div>
      )}

      {action && (
        <div className="mt-auto pt-4">
          <Link
            to={action.to}
            onMouseEnter={warm}
            onFocus={warm}
            className={`${totals.started ? SECONDARY_LINK : PRIMARY_LINK} w-full`}
          >
            {action.label}
          </Link>
        </div>
      )}
    </Card>
  )
}

function StreakChips({ stats }) {
  if (!stats) return null
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-xs font-bold text-ink">
        <FlameIcon size={14} className="text-accent" /> {stats.dailyStreak}d
      </span>
      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-xs font-bold text-ink">
        <StarIcon size={14} className="text-accent" /> Lv {stats.level}
      </span>
    </div>
  )
}

function TodayHeading({ firstRun, stats }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate font-display text-2xl leading-tight font-bold text-ink sm:text-display-lg">
            {firstRun ? 'Master your words.' : 'Today'}
          </h1>
          {!firstRun && (
            <span className="hidden font-mono text-2xs font-semibold tracking-widest text-ink-muted uppercase sm:inline">
              {todayLabel()}
            </span>
          )}
        </div>
        <p className="mt-0.5 hidden max-w-md text-xs text-ink-muted sm:block">
          {firstRun
            ? 'GRE words on a schedule that adapts to you — flip cards, quiz yourself, and watch the streak grow.'
            : 'A short session keeps the schedule honest. Start with what is due.'}
        </p>
      </div>
      <StreakChips stats={stats} />
    </div>
  )
}

function FirstRunPanel({ deck }) {
  return (
    <Card className="mt-4 p-4">
      <p className="font-mono text-3xs font-semibold tracking-widest text-ink-muted uppercase">
        Start here
      </p>
      <p className="mt-1.5 max-w-md text-sm text-ink">
        Nothing reviewed yet. Group 1 is the gentlest entry point — ten words at
        a time, no quiz until you are ready.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {deck && (
          <Link to={`/decks/${deck._id}`} className={PRIMARY_LINK}>
            Start with {deck.title} →
          </Link>
        )}
        <Link to="/quiz" className={SECONDARY_LINK}>
          All-deck quiz
        </Link>
      </div>
    </Card>
  )
}

function TodayPanel({ totalDue, stats, continueDeck }) {
  const goal = goalProgress(stats?.reviewsToday, stats?.dailyGoalTarget)
  const part = continueDeck ? nextDeckPart(continueDeck) : null

  return (
    <Card className="mt-4 space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-3xs font-semibold tracking-widest text-ink-muted uppercase">
            Due today
          </p>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none font-bold text-ink tabular-nums">
              {totalDue}
            </span>
            <span className="truncate text-xs font-semibold text-ink-muted">
              {totalDue === 1 ? 'word ready' : 'words ready'}
            </span>
          </p>
        </div>
        {totalDue > 0 ? (
          <Link to="/practice/due" className={PRIMARY_LINK}>
            Review →
          </Link>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex min-h-11 items-center rounded-xl border border-sage/30 bg-sage/10 px-3 font-display text-xs font-bold text-sage">
              All caught up
            </span>
            {continueDeck && (
              <Link
                to={`/decks/${continueDeck._id}${part ? `?part=${part}` : ''}`}
                className={SECONDARY_LINK}
              >
                Keep going →
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="shrink-0 font-mono text-3xs font-semibold tracking-widest text-ink-muted uppercase">
          Goal
          <span className="hidden font-sans text-2xs font-semibold tracking-normal normal-case sm:inline">
            {' '}
            ·{' '}
            {goal.goal === 0
              ? 'Set one in Settings'
              : goal.met
                ? 'met — nice work'
                : `${goal.remaining} to go`}
          </span>
        </p>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised"
          role="progressbar"
          aria-valuenow={goal.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily goal"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${goal.pct}%` }}
          />
        </div>
        <p className="shrink-0 font-mono text-2xs font-bold text-ink-muted tabular-nums">
          {goal.reviews}
          <span className="font-semibold">/{goal.goal || '—'}</span>
        </p>
      </div>
    </Card>
  )
}

function QuickActions({ continueDeck, totalWeak }) {
  const part = continueDeck ? nextDeckPart(continueDeck) : null
  const link =
    'inline-flex min-h-9 shrink-0 items-center text-xs font-bold text-ink-muted transition-colors hover:text-ink'
  return (
    <div className="mt-1 flex items-center gap-4">
      {continueDeck && (
        <Link
          to={`/decks/${continueDeck._id}${part ? `?part=${part}` : ''}`}
          className={`${link} min-w-0`}
        >
          <span className="truncate">
            Continue {continueDeck.title}
            {part ? ` · Part ${part}` : ''}
          </span>
        </Link>
      )}
      {totalWeak > 0 && (
        <Link to="/practice/weak" className={link}>
          Weak ({totalWeak})
        </Link>
      )}
      <Link to="/quiz" className={`${link} ml-auto sm:ml-0`}>
        All-deck quiz →
      </Link>
    </div>
  )
}

function LibraryBar({ status, onStatus, query, onQuery, showSearch, count, total }) {
  return (
    <div className="z-20 -mx-4 border-b border-line bg-canvas/95 px-4 py-1.5 backdrop-blur sm:-mx-6 sm:px-6 lg:sticky lg:top-16">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-base font-bold text-ink">Your library</h2>
        <div
          role="group"
          aria-label="Deck status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {DECK_STATUS_FILTERS.map((item) => (
            <Chip
              key={item.id}
              pressed={item.id === status}
              onClick={() => onStatus(item.id)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
        {showSearch && (
          <div className="w-full sm:ml-auto sm:w-56">
            <Input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Find a deck — try 12…"
              aria-label="Filter decks"
            />
          </div>
        )}
      </div>
      {(query.trim() || status !== 'all') && (
        <p className="mt-2 text-xs font-semibold text-ink-muted">
          {count} of {total} decks
        </p>
      )}
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="relative h-40 animate-pulse rounded-xl border border-line bg-card p-5 pt-6"
        >
          <span className="absolute -top-3 left-4 h-6 w-9 rounded-t-md bg-raised" />
          <div className="h-4 w-24 rounded bg-raised" />
          <div className="mt-3 h-3 w-32 rounded bg-raised" />
          <div className="mt-4 h-1.5 w-full rounded-full bg-raised" />
          <div className="mt-6 h-9 w-full rounded bg-raised" />
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const { data: decks = [], isLoading, isError } = useDecks()
  const { data: stats } = useGamification()
  const { data: dueData } = useDueWords(1)
  const { data: weakData } = useWeakWords(1)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')

  if (isLoading) {
    return (
      <div className="animate-page">
        <div className="h-7 w-28 animate-pulse rounded bg-raised" />
        <div className="mt-4 h-28 animate-pulse rounded-xl border border-line bg-card" />
        <div className="mt-10">
          <HomeSkeleton />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        data-testid="home-ready"
        className="rounded-lg border border-stamp/30 bg-stamp/10 p-4 text-center text-sm text-stamp"
      >
        Failed to load decks.{' '}
        <Button
          variant="secondary"
          className="ml-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <div data-testid="home-ready">
        <EmptyState
          art={<EmptyArt variant="decks" />}
          title="No decks yet"
          message="Decks will appear here once your administrator adds them."
        />
      </div>
    )
  }

  const sorted = [...decks].sort(
    (a, b) => (a.group ?? Infinity) - (b.group ?? Infinity)
  )
  const firstRun = !sorted.some((deck) => deckTotals(deck).started)
  const totalDue = dueData?.totalDue ?? 0
  const totalWeak = weakData?.totalWeak ?? 0
  const continueDeck = pickContinueDeck(sorted)

  const visible = filterDecks(filterDecksByStatus(sorted, status), query)
  const filtered = status !== 'all' || query.trim().length > 0

  const clearFilters = () => {
    setStatus('all')
    setQuery('')
  }

  return (
    <div data-testid="home-ready" className="animate-page">
      <TodayHeading firstRun={firstRun} stats={stats} />

      {firstRun ? (
        <FirstRunPanel deck={continueDeck} />
      ) : (
        <>
          <TodayPanel totalDue={totalDue} stats={stats} continueDeck={continueDeck} />
          <QuickActions continueDeck={continueDeck} totalWeak={totalWeak} />
        </>
      )}

      <section className="mt-5" data-testid="home-library">
        <LibraryBar
          status={status}
          onStatus={setStatus}
          query={query}
          onQuery={setQuery}
          showSearch={sorted.length > 6}
          count={visible.length}
          total={sorted.length}
        />

        <div className="mt-3">
          {visible.length === 0 ? (
            <EmptyState
              title="No decks match"
              message={
                query.trim()
                  ? `Nothing matches “${query.trim()}” in this filter.`
                  : 'No decks are in this state yet.'
              }
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((deck, i) => (
                <div
                  key={deck._id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <DeckCard deck={deck} />
                </div>
              ))}
            </div>
          )}
          {filtered && visible.length > 0 && (
            <div className="mt-4 text-center">
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
