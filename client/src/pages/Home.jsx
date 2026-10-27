import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefetchDeck, useDecks, useDueWords, useGamification, useProgressSummary } from '../api/queries'
import { filterDecks } from '../utils/deckFilter'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import DeckTile from '../components/DeckTile'
import EmptyArt from '../components/art/EmptyArt'
import { FlameIcon, StarIcon } from '../components/art/icons'

function DeckCard({ deck }) {
  const count = deck.wordCount ?? (deck.wordIds ? deck.wordIds.length : 0)
  const prefetchDeck = usePrefetchDeck()
  const warm = () => prefetchDeck(deck._id)
  const mastered = deck.progress?.mastered || 0
  const pct = count > 0 ? Math.round((mastered / count) * 100) : 0
  const due = deck.dueCount ?? 0
  const parts = deck.parts || []

  return (
    <Card className="flex h-full flex-col border-2 p-5 shadow-md">
      <div className="flex items-center gap-3">
        <DeckTile id={deck._id} title={deck.title} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/decks/${deck._id}`}
            onMouseEnter={warm}
            onFocus={warm}
            className="group"
          >
            <h3 className="truncate font-display text-lg font-bold text-primary group-hover:text-accent dark:text-cream-100 dark:group-hover:text-accent">
              {deck.title}
            </h3>
          </Link>
          <p className="text-xs font-semibold text-slate-500 dark:text-cream-300/80">
            {count} words
            {due > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-bold text-accent">{due} due</span>
              </>
            )}
          </p>
        </div>
        {count > 0 && (mastered > 0 || (deck.progress?.learning || 0) > 0) && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
            {pct}%
          </span>
        )}
      </div>

      {count > 0 && mastered > 0 && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-night-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${deck.title} mastered`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {parts.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10">
          <div className="grid grid-cols-3 gap-2">
            {parts.map((p) => {
              const pCount = p.wordCount ?? 0
              const pMastered = p.progress?.mastered || 0
              const pPct = pCount > 0 ? Math.round((pMastered / pCount) * 100) : 0
              const pDue = p.dueCount ?? 0
              const isDone = pCount > 0 && pMastered === pCount

              return (
                <Link
                  key={p.part}
                  to={`/decks/${deck._id}?part=${p.part}`}
                  onMouseEnter={warm}
                  onFocus={warm}
                  aria-label={`Practice ${deck.title} Part ${p.part}`}
                  className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-center transition-all hover:border-accent hover:bg-gold/30 hover:shadow-sm active:scale-97 dark:border-white/10 dark:bg-night-900/60 dark:hover:border-accent dark:hover:bg-accent/10"
                >
                  <span className="font-display text-xs font-bold text-primary dark:text-cream-100">
                    Part {p.part}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500 dark:text-cream-300/70">
                    {pDue > 0 ? (
                      <span className="font-bold text-accent">{pDue} due</span>
                    ) : isDone ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-300">✓ 100%</span>
                    ) : (
                      `${pPct}%`
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {parts.length === 0 && (
        <div className="mt-auto pt-3">
          <Link
            to={`/decks/${deck._id}`}
            onMouseEnter={warm}
            onFocus={warm}
            className="flex items-center justify-center rounded-lg border border-slate-200 py-2 text-xs font-bold text-primary transition-all hover:border-accent hover:bg-gold/30 dark:border-white/10 dark:text-cream-100 dark:hover:border-accent"
          >
            Practice deck →
          </Link>
        </div>
      )}
    </Card>
  )
}

export default function Home() {
  const { data: decks = [], isLoading, isError } = useDecks()
  // Decorative: never block or break the page on failure
  const { data: stats } = useGamification()
  const { data: summary } = useProgressSummary()
  const { data: dueData } = useDueWords(1)
  const [filter, setFilter] = useState('')

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

  // Sort decks in numeric order; decks without a group sink to the end.
  const sorted = [...decks].sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
  const firstDeck = sorted.find((d) => d.group === 1) ?? sorted[0]
  const started = totalProgress > 0
  const totalDue = dueData?.totalDue ?? 0
  const visible = filterDecks(sorted, filter)

  return (
    <div className="animate-page -m-4 sm:-m-6">
      <div className="bg-gradient-to-br from-primary via-primary to-night-800 px-4 pt-6 pb-20 sm:px-6 sm:pb-28 dark:border-b dark:border-white/10 dark:from-night-900 dark:via-night-900 dark:to-night-950">
        <p className="font-display text-xs font-bold tracking-widest text-accent uppercase">VocabVault</p>
        <h1 className="mt-1 font-display text-display-lg font-bold text-white dark:text-cream-100">Master your words.</h1>
        <p className="mt-1 max-w-md text-sm text-white/70 dark:text-cream-300/80">
          GRE words on a schedule that adapts to you — flip cards, quiz yourself, and watch the streak grow.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {totalDue > 0 ? (
            <Link to="/practice/due">
              <Button className="shadow-lg">
                Review Due Today ({totalDue}) →
              </Button>
            </Link>
          ) : started ? (
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              All caught up!
            </span>
          ) : null}
          {firstDeck && (
            <Link to={`/decks/${firstDeck._id}`}>
              <Button
                variant={totalDue > 0 ? 'secondary' : 'primary'}
                className={
                  totalDue > 0
                    ? 'border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm hover:bg-white/20'
                    : 'shadow-lg'
                }
              >
                {started ? 'Continue practicing →' : `Start with ${firstDeck.title} →`}
              </Button>
            </Link>
          )}
          <Link to="/quiz">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm hover:bg-white/20"
            >
              All-Deck Quiz
            </Button>
          </Link>
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
      <div className="-mt-24 bg-gold/40 px-4 pt-8 pb-10 sm:px-6 sm:pt-12 dark:bg-night-950">
        {sorted.length > 6 && (
          <div className="mx-auto mb-4 max-w-md">
            <Input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Find a deck — try 12…"
              aria-label="Filter decks"
            />
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyState
            title="No decks match"
            message={`Nothing matches “${filter.trim()}”.`}
            action={
              <Button variant="secondary" onClick={() => setFilter('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <>
            {filter.trim() && (
              <p className="mx-auto mb-3 max-w-md text-center text-xs text-slate-500 dark:text-cream-300/70">
                {visible.length} of {sorted.length} shown
              </p>
            )}
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
          </>
        )}
      </div>
    </div>
  )
}
