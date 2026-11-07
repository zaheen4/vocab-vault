import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuizHistory, useReviewHistory } from '../api/queries'
import { groupByDay } from '../utils/historyDays'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
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

// Mono chip shared by parts, scope, box and mode: catalog metadata, not prose.
const CHIP =
  'inline-flex items-center rounded-sm border border-line px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase'

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '< 1m'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading history">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-raised" />
      ))}
    </div>
  )
}

// Day divider: the timeline's only structural element, so it stays quiet —
// a mono date, a rule, and how much happened.
function DayGroup({ label, count, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h2 className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
          {label}
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className="font-mono text-2xs text-ink-muted tabular-nums">
          {count} {count === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <Sheet className="divide-y divide-line px-4 py-1">{children}</Sheet>
    </div>
  )
}

function ScoreStamp({ score, total, percentage }) {
  const tone =
    percentage >= 80
      ? 'border-sage/50 text-sage'
      : percentage >= 50
        ? 'border-accent/50 text-accent-ink'
        : 'border-stamp/50 text-stamp'
  return (
    <span
      className={cn(
        'rounded-sm border px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest tabular-nums',
        tone
      )}
    >
      {score}/{total} · {percentage}%
    </span>
  )
}

function QuizSessionRow({ session }) {
  const [expanded, setExpanded] = useState(false)
  const timeFormatted = formatRelativeTime(session.createdAt)

  return (
    <div className="py-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold text-ink">
              {session.deckTitle}
            </h3>
            <ScoreStamp
              score={session.score}
              total={session.total}
              percentage={session.percentage}
            />
            {session.part && <span className={CHIP}>Part {session.part}</span>}
            <span className={CHIP}>{session.scope === 'all' ? 'All words' : 'Studied words'}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-2xs text-ink-muted">
            <span className="tabular-nums">{formatDuration(session.timeSpentSeconds)}</span>
            {timeFormatted && <time dateTime={session.createdAt}>{timeFormatted}</time>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="font-display text-xs font-bold text-accent-ink underline-offset-2 hover:underline"
          >
            {expanded ? 'Hide question audit' : `Review ${session.answers?.length || 0} questions`}
          </button>
          <span className="font-mono text-2xs text-ink-muted tabular-nums">
            {session.score} correct · {session.total - session.score} missed
          </span>
        </div>

        {expanded && session.answers?.length > 0 && (
          <div className="mt-1 space-y-2 border-t border-line pt-3">
            {session.answers.map((ans, idx) => (
              <div
                key={ans.wordId || idx}
                className="rounded-md border border-line bg-raised/60 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-ink">{ans.word}</span>
                    {ans.partOfSpeech && (
                      <span className="text-xs text-ink-muted italic">{ans.partOfSpeech}.</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'rounded-sm border px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest uppercase',
                      ans.correct
                        ? 'border-sage/50 text-sage'
                        : 'border-stamp/50 text-stamp'
                    )}
                  >
                    {ans.correct ? 'Correct' : 'Missed'}
                  </span>
                </div>

                {ans.correct ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    {ans.correctAnswer || ans.definition}
                  </p>
                ) : (
                  <div className="mt-1 space-y-0.5 text-xs">
                    <p className="text-stamp">
                      <span className="font-bold">Your answer:</span> {ans.userAnswer || 'No answer'}
                    </p>
                    <p className="text-sage">
                      <span className="font-bold">Correct:</span>{' '}
                      {ans.correctAnswer || ans.definition}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewRow({ review }) {
  const modeLabel = MODE_LABELS[review.mode] || 'Practice'
  const timeFormatted = formatRelativeTime(review.reviewedAt)

  return (
    <div className="py-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold text-ink">{review.word}</h3>
            <span
              className={cn(
                'rounded-sm border px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest uppercase',
                review.correct ? 'border-sage/50 text-sage' : 'border-stamp/50 text-stamp'
              )}
            >
              {review.correct ? 'Correct' : 'Needs Review'}
            </span>
            <span className={CHIP}>Box {review.box}</span>
            <span className={CHIP}>{modeLabel}</span>
          </div>
          {timeFormatted && (
            <time dateTime={review.reviewedAt} className="font-mono text-2xs text-ink-muted">
              {timeFormatted}
            </time>
          )}
        </div>

        <p className="max-w-prose text-sm leading-relaxed font-medium text-ink-muted">
          {review.partOfSpeech && (
            <span className="mr-1.5 italic">{review.partOfSpeech}.</span>
          )}
          {review.definition}
        </p>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase tabular-nums">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  )
}

export default function History() {
  const [activeTab, setActiveTab] = useState('quiz')
  const [quizPage, setQuizPage] = useState(1)
  const [cardPage, setCardPage] = useState(1)
  const [cardFilter, setCardFilter] = useState('all')

  const {
    data: quizData,
    isLoading: isQuizLoading,
    isError: isQuizError,
    refetch: refetchQuiz,
  } = useQuizHistory({ page: quizPage, limit: 10 })

  const {
    data: cardData,
    isLoading: isCardLoading,
    isError: isCardError,
    refetch: refetchCard,
  } = useReviewHistory({ page: cardPage, limit: 20, filter: cardFilter })

  const sessions = quizData?.sessions || []
  const quizTotal = quizData?.total || 0
  const quizTotalPages = quizData?.totalPages || 0
  const stats = quizData?.stats || { totalQuizzes: 0, averageScore: 0, bestScore: 0, totalQuestions: 0 }

  const cardHistory = cardData?.history || []
  const cardTotal = cardData?.total || 0
  const cardTotalPages = cardData?.totalPages || 0

  const quizGroups = groupByDay(sessions, (session) => session.createdAt)
  const cardGroups = groupByDay(cardHistory, (review) => review.reviewedAt)

  function handleFilterChange(tabId) {
    setCardFilter(tabId)
    setCardPage(1)
  }

  const tabClass = (active) =>
    cn(
      'rounded-lg px-4 py-2 font-display text-sm font-bold transition-colors',
      active ? 'bg-card text-ink shadow-paper' : 'text-ink-muted hover:text-ink'
    )

  return (
    <div className="animate-page space-y-6 pb-24 sm:pb-8">
      <PageHeader
        eyebrow="Activity"
        title="History & Performance"
        sub="Track your quiz scores, audit test attempts, and inspect SRS card transitions."
      />

      <div
        className="flex w-full gap-1 rounded-xl border border-line bg-raised/60 p-1 sm:inline-flex sm:w-auto"
        role="tablist"
        aria-label="History categories"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quiz'}
          onClick={() => setActiveTab('quiz')}
          className={tabClass(activeTab === 'quiz')}
        >
          Quiz History ({quizTotal})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cards'}
          onClick={() => setActiveTab('cards')}
          className={tabClass(activeTab === 'cards')}
        >
          Card Reviews ({cardTotal})
        </button>
      </div>

      {activeTab === 'quiz' ? (
        <>
          {stats.totalQuizzes > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Quizzes taken', value: stats.totalQuizzes, tone: 'text-ink' },
                { label: 'Average score', value: `${stats.averageScore}%`, tone: 'text-accent-ink' },
                { label: 'Best score', value: `${stats.bestScore}%`, tone: 'text-sage' },
                { label: 'Questions tested', value: stats.totalQuestions, tone: 'text-ink' },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-line bg-card p-3.5 text-center shadow-paper"
                >
                  <p className={cn('font-display text-2xl font-bold tabular-nums', tile.tone)}>
                    {tile.value}
                  </p>
                  <p className="mt-0.5 font-mono text-2xs tracking-widest text-ink-muted uppercase">
                    {tile.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isQuizLoading ? (
            <HistorySkeleton />
          ) : isQuizError ? (
            <div className="rounded-xl border border-stamp/30 bg-stamp/5 p-4 text-center text-sm text-stamp">
              Failed to load quiz history.{' '}
              <button type="button" className="underline" onClick={() => refetchQuiz()}>
                Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              art={<EmptyArt variant="review" size={120} />}
              title="No quizzes completed yet"
              message="Complete a deck quiz or all-deck cumulative quiz to track your test scores and question audits."
              action={
                <Link to="/quiz">
                  <Button variant="primary">Take a Quiz</Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {quizGroups.map((group) => (
                  <DayGroup key={group.key} label={group.label} count={group.items.length}>
                    {group.items.map((session) => (
                      <QuizSessionRow key={session._id} session={session} />
                    ))}
                  </DayGroup>
                ))}
              </div>

              <Pagination page={quizPage} totalPages={quizTotalPages} onChange={setQuizPage} />
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Review filters">
            {FILTER_TABS.map((tab) => {
              const active = cardFilter === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => handleFilterChange(tab.id)}
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-full border px-3.5 font-display text-xs font-bold transition-colors',
                    active
                      ? 'border-accent bg-accent/15 text-accent-ink'
                      : 'border-line bg-card text-ink-muted hover:text-ink'
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {isCardLoading ? (
            <HistorySkeleton />
          ) : isCardError ? (
            <div className="rounded-xl border border-stamp/30 bg-stamp/5 p-4 text-center text-sm text-stamp">
              Failed to load card reviews.{' '}
              <button type="button" className="underline" onClick={() => refetchCard()}>
                Retry
              </button>
            </div>
          ) : cardHistory.length === 0 ? (
            <EmptyState
              art={<EmptyArt variant="review" size={120} />}
              title={cardFilter === 'all' ? 'No card reviews recorded yet' : `No ${cardFilter} reviews found`}
              message="Practice flashcards, complete quizzes, or type words to build your Leitner timeline."
              action={
                <Link to="/">
                  <Button variant="primary">Browse Decks</Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {cardGroups.map((group) => (
                  <DayGroup key={group.key} label={group.label} count={group.items.length}>
                    {group.items.map((review) => (
                      <ReviewRow key={review.reviewId} review={review} />
                    ))}
                  </DayGroup>
                ))}
              </div>

              <Pagination page={cardPage} totalPages={cardTotalPages} onChange={setCardPage} />
            </>
          )}
        </>
      )}
    </div>
  )
}
