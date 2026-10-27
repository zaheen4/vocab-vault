import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefetchDeck, useDecks, useGamification, useProgressSummary } from '../api/queries'
import { filterDecks } from '../utils/deckFilter'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import DeckTile from '../components/DeckTile'
import EmptyArt from '../components/art/EmptyArt'
import { FlameIcon, StarIcon } from '../components/art/icons'

function buildGroupedData(visible, isGroupedView) {
  if (!isGroupedView) return { groups: [], custom: [] }
  const map = new Map()
  const custom = []
  for (const d of visible) {
    if (d.group != null && d.part != null) {
      if (!map.has(d.group)) {
        map.set(d.group, { group: d.group, parts: [] })
      }
      map.get(d.group).parts.push(d)
    } else {
      custom.push(d)
    }
  }
  return {
    groups: [...map.values()].sort((a, b) => a.group - b.group),
    custom,
  }
}

function GroupCard({ groupData }) {
  const prefetchDeck = usePrefetchDeck()
  const totalCount = groupData.parts.reduce((sum, d) => sum + (d.wordCount ?? 0), 0)
  const totalMastered = groupData.parts.reduce((sum, d) => sum + (d.progress?.mastered || 0), 0)
  const totalLearning = groupData.parts.reduce((sum, d) => sum + (d.progress?.learning || 0), 0)
  const totalDue = groupData.parts.reduce((sum, d) => sum + (d.dueCount ?? 0), 0)
  const pct = totalCount > 0 ? Math.round((totalMastered / totalCount) * 100) : 0
  const firstPart = groupData.parts[0]
  const title = `Group ${groupData.group}`

  return (
    <Card className="flex h-full flex-col border-2 p-5 shadow-md">
      <div className="flex items-center gap-3">
        <DeckTile id={firstPart?._id || String(groupData.group)} title={title} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold truncate text-primary dark:text-cream-100">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-cream-300/80">
            {totalCount} words
            {totalDue > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-bold text-accent">{totalDue} due</span>
              </>
            )}
          </p>
        </div>
        {totalCount > 0 && (totalMastered > 0 || totalLearning > 0) && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
            {pct}%
          </span>
        )}
      </div>

      {totalCount > 0 && totalMastered > 0 && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-night-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${title} mastered`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Subgroups: 3 Side-by-Side tactile buttons */}
      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10">
        <div className="grid grid-cols-3 gap-2">
          {groupData.parts.map((partDeck) => {
            const pCount = partDeck.wordCount ?? 0
            const pMastered = partDeck.progress?.mastered || 0
            const pPct = pCount > 0 ? Math.round((pMastered / pCount) * 100) : 0
            const pDue = partDeck.dueCount ?? 0
            const isDone = pCount > 0 && pMastered === pCount

            return (
              <Link
                key={partDeck._id}
                to={`/decks/${partDeck._id}`}
                onMouseEnter={() => prefetchDeck(partDeck._id)}
                onFocus={() => prefetchDeck(partDeck._id)}
                aria-label={`Practice Group ${groupData.group} Part ${partDeck.part}`}
                className="group relative flex min-h-11 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-center transition-all hover:border-accent hover:bg-gold/30 hover:shadow-sm active:scale-97 dark:border-white/10 dark:bg-night-900/60 dark:hover:border-accent dark:hover:bg-accent/10"
              >
                <span className="font-display text-xs font-bold text-primary dark:text-cream-100">
                  Part {partDeck.part}
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
    </Card>
  )
}

function DeckCard({ deck }) {
  const count = deck.wordCount ?? (deck.wordIds ? deck.wordIds.length : 0)
  const prefetchDeck = usePrefetchDeck()
  const warm = () => prefetchDeck(deck._id)
  const mastered = deck.progress?.mastered || 0
  const pct = count > 0 ? Math.round((mastered / count) * 100) : 0
  const due = deck.dueCount ?? 0
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
      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-white/10">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-cream-300/80">
            {count} words
            {due > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-bold text-accent">{due} due</span>
              </>
            )}
          </p>
          {count > 0 && (mastered > 0 || (deck.progress?.learning || 0) > 0) && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
              {pct}% mastered
            </p>
          )}
        </div>
        {count > 0 && mastered > 0 && (
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-night-800"
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
  const [filter, setFilter] = useState('')
  const [partFilter, setPartFilter] = useState('all')

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

  // Sort decks: groups ascending, then parts ascending
  const sorted = [...decks].sort((a, b) => {
    if ((a.group ?? Infinity) !== (b.group ?? Infinity)) {
      return (a.group ?? Infinity) - (b.group ?? Infinity)
    }
    return (a.part ?? Infinity) - (b.part ?? Infinity)
  })
  const firstDeck = sorted.find((d) => d.group === 1 && (d.part === 1 || !d.part)) ?? sorted[0]
  const started = totalProgress > 0

  const visible = filterDecks(sorted, filter).filter(
    (d) => partFilter === 'all' || d.part === Number(partFilter) || d.group == null
  )

  const isGroupedView = partFilter === 'all' && !filter.trim()
  const groupedData = buildGroupedData(visible, isGroupedView)

  return (
    <div className="animate-page -m-4 sm:-m-6">
      <div className="bg-gradient-to-br from-primary via-primary to-night-800 px-4 pt-6 pb-20 sm:px-6 sm:pb-28 dark:border-b dark:border-white/10 dark:from-night-900 dark:via-night-900 dark:to-night-950">
        <p className="font-display text-xs font-bold tracking-widest text-accent uppercase">VocabVault</p>
        <h1 className="mt-1 font-display text-display-lg font-bold text-white dark:text-cream-100">Master your words.</h1>
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
          <Link to="/quiz">
            <Button
              variant="secondary"
              className="border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm hover:bg-white/20"
            >
              All-Deck Quiz ⚡
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
              placeholder="Find a deck — try 12 or Part 1…"
              aria-label="Filter decks"
            />
          </div>
        )}

        {/* Quick Part filter pills */}
        <div className="mx-auto mb-5 flex flex-wrap items-center justify-center gap-1.5">
          {['all', 1, 2, 3].map((p) => {
            const active = partFilter === p
            const label = p === 'all' ? 'All Parts' : `Part ${p}`
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPartFilter(p)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                  active
                    ? 'bg-accent text-primary shadow-sm'
                    : 'border border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:text-primary dark:border-white/10 dark:bg-night-900/80 dark:text-cream-300 dark:hover:bg-night-800'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No decks match"
            message={`Nothing matches “${filter.trim()}”.`}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setFilter('')
                  setPartFilter('all')
                }}
              >
                Clear filter
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

            {isGroupedView ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedData.groups.map((groupData, i) => (
                  <div
                    key={`group-${groupData.group}`}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <GroupCard groupData={groupData} />
                  </div>
                ))}
                {groupedData.custom.map((deck, i) => (
                  <div
                    key={deck._id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <DeckCard deck={deck} />
                  </div>
                ))}
              </div>
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
          </>
        )}
      </div>
    </div>
  )
}
