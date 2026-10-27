import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuizHistory, useReviewHistory } from '../api/queries'
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
        <div
          key={i}
          className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-white/10 dark:bg-night-900"
        />
      ))}
    </div>
  )
}

function QuizSessionCard({ session }) {
  const [expanded, setExpanded] = useState(false)
  const timeFormatted = formatRelativeTime(session.createdAt)

  const scoreBadgeTone =
    session.percentage >= 80
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : session.percentage >= 50
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-lg font-bold text-primary dark:text-cream-100">
              {session.deckTitle}
            </h2>
            {session.part && (
              <span className="inline-flex items-center rounded-md border border-slate-200 px-2 py-0.5 font-display text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-cream-300">
                Part {session.part}
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-display text-xs text-slate-500 dark:bg-night-800 dark:text-cream-300/70">
              {session.scope === 'all' ? 'All Words' : 'Studied Words'}
            </span>
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-xs font-bold', scoreBadgeTone)}>
              {session.score}/{session.total} ({session.percentage}%)
            </span>
          </div>

          <div className="flex items-center gap-3 font-sans text-xs text-slate-400 dark:text-cream-300/60">
            <span>{formatDuration(session.timeSpentSeconds)}</span>
            {timeFormatted && <time dateTime={session.createdAt}>{timeFormatted}</time>}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-white/5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-display text-xs font-bold text-accent hover:text-accent-deep dark:text-accent dark:hover:text-gold"
          >
            {expanded ? 'Hide question audit' : `Review ${session.answers?.length || 0} questions`}
          </button>
          <span className="font-sans text-xs text-slate-400 dark:text-cream-300/60">
            {session.score} correct · {session.total - session.score} missed
          </span>
        </div>

        {expanded && session.answers?.length > 0 && (
          <div className="mt-2 space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
            {session.answers.map((ans, idx) => (
              <div
                key={ans.wordId || idx}
                className="rounded-md border border-slate-100 bg-slate-50/60 p-3 text-sm dark:border-white/5 dark:bg-night-950/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-primary dark:text-cream-100">
                      {ans.word}
                    </span>
                    {ans.partOfSpeech && (
                      <span className="font-sans text-xs text-slate-400 italic dark:text-cream-300/60">
                        {ans.partOfSpeech}.
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded px-2 py-0.5 font-display text-xs font-bold',
                      ans.correct
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    )}
                  >
                    {ans.correct ? 'Correct' : 'Missed'}
                  </span>
                </div>

                {ans.correct ? (
                  <p className="mt-1 font-sans text-xs text-slate-600 dark:text-cream-300">
                    {ans.correctAnswer || ans.definition}
                  </p>
                ) : (
                  <div className="mt-1 space-y-0.5 font-sans text-xs">
                    <p className="text-red-600 dark:text-red-400">
                      <span className="font-bold">Your answer:</span> {ans.userAnswer || 'No answer'}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      <span className="font-bold">Correct:</span> {ans.correctAnswer || ans.definition}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
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

  function handleFilterChange(tabId) {
    setCardFilter(tabId)
    setCardPage(1)
  }

  return (
    <div className="animate-page space-y-6 pb-24 sm:pb-8">
      <PageHeader
        eyebrow="Activity"
        title="History & Performance"
        sub="Track your quiz scores, audit test attempts, and inspect SRS card transitions."
      />

      <div className="flex border-b border-slate-200 dark:border-white/10" role="tablist" aria-label="History categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quiz'}
          onClick={() => setActiveTab('quiz')}
          className={cn(
            'border-b-2 px-4 py-2 font-display text-sm font-bold transition-colors',
            activeTab === 'quiz'
              ? 'border-accent text-accent-deep dark:text-accent'
              : 'border-transparent text-slate-500 hover:text-primary dark:text-cream-300/70 dark:hover:text-cream-100'
          )}
        >
          Quiz History ({quizTotal})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cards'}
          onClick={() => setActiveTab('cards')}
          className={cn(
            'border-b-2 px-4 py-2 font-display text-sm font-bold transition-colors',
            activeTab === 'cards'
              ? 'border-accent text-accent-deep dark:text-accent'
              : 'border-transparent text-slate-500 hover:text-primary dark:text-cream-300/70 dark:hover:text-cream-100'
          )}
        >
          Card Reviews ({cardTotal})
        </button>
      </div>

      {activeTab === 'quiz' ? (
        <>
          {stats.totalQuizzes > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center dark:border-white/10 dark:bg-night-900">
                <p className="font-display text-2xl font-bold text-primary dark:text-cream-100">
                  {stats.totalQuizzes}
                </p>
                <p className="mt-0.5 font-sans text-xs text-slate-500 dark:text-cream-300/70">
                  Quizzes Taken
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center dark:border-white/10 dark:bg-night-900">
                <p className="font-display text-2xl font-bold text-accent">
                  {stats.averageScore}%
                </p>
                <p className="mt-0.5 font-sans text-xs text-slate-500 dark:text-cream-300/70">
                  Average Score
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center dark:border-white/10 dark:bg-night-900">
                <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.bestScore}%
                </p>
                <p className="mt-0.5 font-sans text-xs text-slate-500 dark:text-cream-300/70">
                  Best Score
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center dark:border-white/10 dark:bg-night-900">
                <p className="font-display text-2xl font-bold text-primary dark:text-cream-100">
                  {stats.totalQuestions}
                </p>
                <p className="mt-0.5 font-sans text-xs text-slate-500 dark:text-cream-300/70">
                  Questions Tested
                </p>
              </div>
            </div>
          )}

          {isQuizLoading ? (
            <HistorySkeleton />
          ) : isQuizError ? (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
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
              <div className="space-y-3">
                {sessions.map((s) => (
                  <QuizSessionCard key={s._id} session={s} />
                ))}
              </div>

              {quizTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    chunky
                    disabled={quizPage <= 1}
                    onClick={() => setQuizPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="font-display text-xs font-bold text-slate-500 dark:text-cream-300/80">
                    Page {quizPage} of {quizTotalPages}
                  </span>
                  <Button
                    variant="secondary"
                    chunky
                    disabled={quizPage >= quizTotalPages}
                    onClick={() => setQuizPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
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

          {isCardLoading ? (
            <HistorySkeleton />
          ) : isCardError ? (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
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
              <div className="space-y-3">
                {cardHistory.map((review) => (
                  <ReviewRow key={review.reviewId} review={review} />
                ))}
              </div>

              {cardTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    chunky
                    disabled={cardPage <= 1}
                    onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="font-display text-xs font-bold text-slate-500 dark:text-cream-300/80">
                    Page {cardPage} of {cardTotalPages}
                  </span>
                  <Button
                    variant="secondary"
                    chunky
                    disabled={cardPage >= cardTotalPages}
                    onClick={() => setCardPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
