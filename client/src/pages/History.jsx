import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useReviewHistory } from '../api/queries'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import { formatRelativeTime } from '../utils/date'
import { cn } from '../utils/cn'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'correct', label: 'Correct' },
  { id: 'incorrect', label: 'Needs Review' },
]

const MODE_LABELS = {
  practice: 'Practice',
  quiz: 'Quiz',
  typing: 'Typing',
}

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading review history">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-white/10 dark:bg-night-900"
        />
      ))}
    </div>
  )
}

function ReviewRow({ review }) {
  const modeLabel = MODE_LABELS[review.mode] || 'Practice'
  const timeFormatted = formatRelativeTime(review.reviewedAt)

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-sans text-xl font-bold text-primary dark:text-cream-100">
              {review.word}
            </h2>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-xs font-bold',
                review.correct
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              )}
            >
              {review.correct ? 'Correct' : 'Needs Review'}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-display text-xs font-semibold text-slate-700 dark:bg-night-800 dark:text-cream-300">
              Box {review.box}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 font-display text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-cream-300/80">
              {modeLabel}
            </span>
          </div>

          {timeFormatted && (
            <time
              dateTime={review.reviewedAt}
              className="font-sans text-xs text-slate-400 dark:text-cream-300/60"
            >
              {timeFormatted}
            </time>
          )}
        </div>

        <p className="font-sans text-sm leading-relaxed font-medium text-slate-600 dark:text-cream-300">
          {review.partOfSpeech && (
            <span className="mr-1.5 text-slate-400 italic dark:text-cream-300/70">
              {review.partOfSpeech}.
            </span>
          )}
          {review.definition}
        </p>
      </div>
    </Card>
  )
}

export default function History() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')

  const { data, isLoading, isError, refetch } = useReviewHistory({
    page,
    limit: 20,
    filter,
  })

  const history = data?.history || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  function handleFilterChange(tabId) {
    setFilter(tabId)
    setPage(1)
  }

  return (
    <div className="animate-page space-y-6 pb-24 sm:pb-8">
      <PageHeader
        eyebrow="Activity"
        title="Review History"
        sub={
          total === 0
            ? 'Timeline of your card reviews and Leitner box transitions.'
            : `${total} review${total === 1 ? '' : 's'} recorded in your study history.`
        }
      />

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Review filters">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => handleFilterChange(tab.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 font-display text-xs font-bold transition-all',
                active
                  ? 'bg-accent text-primary shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-night-800 dark:text-cream-300 dark:hover:bg-night-800/80'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : isError ? (
        <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
          Failed to load review history.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          art={<EmptyArt variant="review" size={120} />}
          title={filter === 'all' ? 'No reviews recorded yet' : `No ${filter} reviews found`}
          message="Practice flashcards, complete quizzes, or type words to build your chronological timeline."
          action={
            <Link to="/">
              <Button variant="primary">Browse Decks</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {history.map((review) => (
              <ReviewRow key={review.reviewId} review={review} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                chunky
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-display text-xs font-bold text-slate-500 dark:text-cream-300/80">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                chunky
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
