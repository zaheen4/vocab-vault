import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { isStarred, useBookmarks, useInvalidateAfterReview, useQuizPool, useSaveQuizSession, useToggleBookmark } from '../api/queries'
import { useSlideDirection } from '../utils/navDirection'
import { getSessionMessage } from '../utils/sessionMessages'
import { shouldCelebrate } from '../utils/celebrate'
import Button from '../components/ui/Button'
import SessionHud from '../components/SessionHud'
import SessionResults from '../components/SessionResults'
import DeckTile from '../components/DeckTile'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import Toast from '../components/ui/Toast'

const LENGTHS = [5, 10, 20]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build `count` multiple-choice questions from deck words. Distractors prefer
// the same part of speech; `fallbackPool` (cross-deck words) fills in when the
// deck itself has fewer than 4 words.
function buildQuestions(deckWords, fallbackPool, count) {
  const inDeck = new Set(deckWords.map((w) => w._id))
  const pool = [
    ...deckWords,
    ...fallbackPool.filter((w) => !inDeck.has(w._id)),
  ]
  return shuffle(deckWords)
    .slice(0, Math.min(count, deckWords.length))
    .map((word) => {
      const samePos = pool.filter(
        (w) => w._id !== word._id && w.partOfSpeech && w.partOfSpeech === word.partOfSpeech
      )
      const others = pool.filter((w) => w._id !== word._id && !samePos.includes(w))
      const distractors = shuffle([...samePos, ...others])
        .slice(0, 3)
        .map((w) => w.definition)
      const options = shuffle([word.definition, ...distractors])
      return { word, options, answerIndex: options.indexOf(word.definition) }
    })
}

export default function Quiz({ deckId }) {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const id = deckId ?? params.id
  const isAllDeck = id === 'all'
  const partParam = searchParams.get('part')
  const part = !isAllDeck && partParam ? Number(partParam) : undefined
  const [scope, setScope] = useState('viewed') // 'viewed' | 'all'
  // Shared pool with Typing: switching modes is a cache hit after first load.
  const { data: poolData, isLoading, isError } = useQuizPool(id, 50, isAllDeck ? scope : 'viewed', part)
  const invalidateAfterReview = useInvalidateAfterReview()
  const { data: bookmarks = [] } = useBookmarks()
  const toggleBookmark = useToggleBookmark()
  const baseTitle = poolData?.title || (isAllDeck ? 'All Decks' : '')
  const deckTitle = baseTitle ? (!isAllDeck && part ? `${baseTitle} — Part ${part}` : baseTitle) : ''
  const pool = poolData?.words ?? []
  const [status, setStatus] = useState('loading') // loading|error|empty|idle|ready|done
  const [length, setLength] = useState(10)
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [pending, setPending] = useState(null) // {wordId, correct} awaiting save
  const [saveError, setSaveError] = useState(false)
  const [results, setResults] = useState([])
  const [score, setScore] = useState(0)
  const [levelEvent, setLevelEvent] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [toast, setToast] = useState(null)
  const [finalMessage, setFinalMessage] = useState(null)
  const slideCls = useSlideDirection()
  const saveSession = useSaveQuizSession()
  const startTimeRef = useRef(null)
  // Synchronous submit guard (see Practice.jsx busyRef): state flags are
  // stale across rapid double-clicks, so the ref owns the lock
  const busyRef = useRef(false)
  const lengths = isAllDeck ? [5, 10, 20, 30] : LENGTHS

  useEffect(() => {
    setStatus('loading')
    setQuestions([])
    setIndex(0)
    setPicked(null)
    setPending(null)
    setSaveError(false)
    setResults([])
    setScore(0)
    setLevelEvent(null)
    setConfetti(false)
    setToast(null)
    setFinalMessage(null)
    busyRef.current = false
  }, [id, scope, part])

  useEffect(() => {
    if (isLoading) {
      setStatus('loading')
      return
    }
    if (isError) {
      setStatus('error')
      return
    }
    // First settle only — afterwards the start/ready/done flow owns status.
    setStatus((s) => (s === 'loading' ? (pool.length === 0 ? 'empty' : 'idle') : s))
  }, [isLoading, isError, pool])

  async function start() {
    let fallback = []
    if (pool.length < 4) {
      try {
        const data = await api.get('/words?limit=50')
        fallback = data.words || []
      } catch (err) {
        console.error(err)
      }
    }
    startTimeRef.current = Date.now()
    setQuestions(buildQuestions(pool, fallback, length))
    setIndex(0)
    setPicked(null)
    setPending(null)
    setSaveError(false)
    setResults([])
    setScore(0)
    setLevelEvent(null)
    setConfetti(false)
    setToast(null)
    setFinalMessage(null)
    busyRef.current = false
    setStatus('ready')
  }

  async function saveAnswer(payload, answerItem) {
    try {
      const data = await api.post('/progress/review', payload)
      setResults((r) => [...r, answerItem])
      if (payload.correct) setScore((s) => s + 1)
      if (data.gamification?.levelUp) setLevelEvent({ newLevel: data.gamification.level })
      if (data.gamification?.newBadges?.length) {
        const names = data.gamification.newBadges.map((b) => `${b.icon} ${b.name}`).join(' · ')
        setToast({ variant: 'gold', message: `Badge earned: ${names}!` })
      }
      invalidateAfterReview(id)
      setPending(null)
      setSaveError(false)
      return true
    } catch (err) {
      console.error(err)
      setSaveError(true)
      return false
    }
  }

  async function choose(optIdx) {
    if (busyRef.current || picked !== null || pending) return // one answer per question
    busyRef.current = true
    const q = questions[index]
    const correct = optIdx === q.answerIndex
    const payload = { wordId: q.word._id, correct, mode: 'quiz' }
    const answerItem = {
      wordId: q.word._id,
      word: q.word.word,
      definition: q.word.definition,
      partOfSpeech: q.word.partOfSpeech || null,
      userAnswer: q.options[optIdx],
      correctAnswer: q.options[q.answerIndex],
      correct,
    }
    setPicked(optIdx)
    setPending({ payload, answerItem })
    await saveAnswer(payload, answerItem)
  }

  async function retrySave() {
    if (!pending) return
    await saveAnswer(pending.payload, pending.answerItem)
  }

  function next() {
    setPicked(null)
    setPending(null)
    setSaveError(false)
    busyRef.current = false
    if (index + 1 >= questions.length) {
      const correctCount = results.filter((r) => r.correct).length
      if (shouldCelebrate({ correct: correctCount, total: results.length, levelUp: !!levelEvent })) {
        setConfetti(true)
      }
      setFinalMessage(
        getSessionMessage({
          correct: correctCount,
          total: results.length,
          levelUp: !!levelEvent,
          level: levelEvent?.newLevel ?? null,
        })
      )
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      )
      saveSession.mutate({
        deckId: isAllDeck ? null : id && id !== 'all' ? id : null,
        deckTitle: isAllDeck ? 'All-Deck Quiz' : part ? `${deckTitle} · Part ${part}` : deckTitle,
        part: part ? Number(part) : null,
        scope: isAllDeck ? scope : 'viewed',
        score: correctCount,
        total: results.length,
        timeSpentSeconds: durationSeconds,
        answers: results,
      })
      setStatus('done')
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-xl border border-line bg-card" />
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-stamp/30 bg-stamp/10 p-4 text-center text-sm text-stamp">
        Failed to load the quiz.{' '}
        <Button variant="secondary" className="ml-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <EmptyState
        art={<EmptyArt variant="review" />}
        title={isAllDeck ? 'No studied words yet!' : 'Practice first!'}
        message={
          isAllDeck
            ? "You haven't practiced any words yet. Jump in right now with all GRE words, or run through a deck first."
            : "Quizzes cover words you've already seen. Run through the flashcards once, then come back and test yourself."
        }
        action={
          isAllDeck ? (
            <div className="flex justify-center gap-2">
              <Button onClick={() => setScope('all')}>Quiz all GRE words →</Button>
              <Link to="/">
                <Button variant="secondary">Browse decks</Button>
              </Link>
            </div>
          ) : (
            <Link to={`/decks/${id}`}>
              <Button>Practice this deck</Button>
            </Link>
          )
        }
      />
    )
  }

  if (status === 'idle') {
    return (
      <div className={`mx-auto max-w-2xl space-y-4 text-center ${slideCls}`}>
        <Link
          to="/"
          className="inline-block text-sm text-ink-muted hover:text-ink"
        >
          ← {isAllDeck ? 'Back to decks' : deckTitle}
        </Link>
        <div className="flex justify-center">
          <DeckTile id={id} title={deckTitle} size="lg" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">
          {isAllDeck ? 'All-Deck Quiz' : 'Quiz yourself'}
        </h1>
        <p className="text-sm text-ink-muted">
          {isAllDeck
            ? 'Cumulative test across all 37 GregMat groups. Pick a definition for each word — every answer feeds your SRS and XP.'
            : `${pool.length} viewed word${pool.length === 1 ? '' : 's'} ready. Pick a definition for each word — every answer is recorded like practice.`}
        </p>

        {isAllDeck && (
          <div className="flex justify-center gap-2">
            <Button
              variant={scope === 'viewed' ? 'primary' : 'secondary'}
              onClick={() => setScope('viewed')}
              aria-pressed={scope === 'viewed'}
              className="text-xs"
            >
              Words I&apos;ve studied
            </Button>
            <Button
              variant={scope === 'all' ? 'primary' : 'secondary'}
              onClick={() => setScope('all')}
              aria-pressed={scope === 'all'}
              className="text-xs"
            >
              All GRE words (1,110)
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {lengths.map((n) => (
            <Button
              key={n}
              variant={length === n ? 'primary' : 'secondary'}
              onClick={() => setLength(n)}
              aria-pressed={length === n}
              className="px-5 py-2.5"
            >
              {n}
            </Button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          {Math.min(length, pool.length || length)} questions
        </p>
        <Button onClick={start}>Start quiz</Button>
      </div>
    )
  }

  if (status === 'done') {
    const correctCount = results.filter((r) => r.correct).length
    const pct = results.length === 0 ? 0 : Math.round((correctCount / results.length) * 100)
    return (
      <SessionResults
        confetti={confetti}
        message={finalMessage || 'Quiz complete!'}
        subtitle={`You scored ${correctCount} of ${results.length} (${pct}%).`}
        correct={correctCount}
        total={results.length}
        results={results}
        actions={
          <>
            <Button variant="secondary" onClick={() => setStatus('idle')}>
              New quiz
            </Button>
            <Link to="/history">
              <Button variant="secondary">View in Quiz History &rarr;</Button>
            </Link>
            {!isAllDeck && (
              <Link to={`/decks/${id}`}>
                <Button variant="secondary">Practice flashcards</Button>
              </Link>
            )}
            <Link to="/">
              <Button>Back to decks</Button>
            </Link>
          </>
        }
      />
    )
  }

  const q = questions[index]
  const answered = picked !== null && !pending

  return (
    <div className={`mx-auto max-w-2xl space-y-4 py-2 ${slideCls}`}>
      <SessionHud
        backTo="/"
        backLabel={deckTitle}
        index={index}
        total={questions.length}
        score={score}
        actions={
          <Button
            variant="secondary"
            aria-label={isStarred(bookmarks, q.word._id) ? `Remove ${q.word.word} from saved` : `Save ${q.word.word}`}
            aria-pressed={isStarred(bookmarks, q.word._id)}
            onClick={() =>
              toggleBookmark.mutate(
                { wordId: q.word._id, starred: isStarred(bookmarks, q.word._id) },
                { onError: () => setToast({ variant: 'error', message: "Couldn't save that word." }) }
              )
            }
          >
            {isStarred(bookmarks, q.word._id) ? '★' : '☆'}
          </Button>
        }
      />

      <div className="relative overflow-hidden rounded-xl border-2 border-line bg-card p-8 pt-9 text-center shadow-paper">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-accent" />
        <p className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
          {q.word.partOfSpeech || 'What does this mean?'}
        </p>
        <h2 className="mt-2 text-display-lg font-bold break-words text-primary dark:text-cream-100">
          {q.word.word}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2" key={q.word._id}>
        {q.options.map((opt, i) => {
          let cls = 'border-line bg-card hover:border-accent hover:bg-gold/30'
          if (picked !== null) {
            if (i === q.answerIndex)
              cls = 'border-sage/50 bg-sage/10 text-sage'
            else if (i === picked)
              cls = 'border-stamp/50 bg-stamp/10 text-stamp'
            else cls = 'border-line bg-card opacity-50'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              style={picked === null ? { animationDelay: `${i * 50}ms` } : undefined}
              className={`min-h-12 rounded-lg border-2 px-4 py-3 text-left font-display text-sm font-bold text-ink transition-all active:scale-99 disabled:cursor-default ${picked === null ? 'animate-fade-up' : 'animate-pop'} ${cls}`}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-raised font-mono text-xs font-bold text-ink-muted">
                {picked !== null && i === q.answerIndex
                  ? '✓'
                  : picked === i && i !== q.answerIndex
                    ? '✗'
                    : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {saveError && (
        <div className="animate-pop flex items-center justify-center gap-3 rounded-lg border border-stamp/30 bg-stamp/10 px-4 py-3 text-sm font-semibold text-stamp">
          <span>Couldn&apos;t save that answer.</span>
          <button className="ml-auto underline" onClick={retrySave}>
            Retry
          </button>
        </div>
      )}

      {answered && (
        <div className="space-y-3">
          <p className="text-center text-sm text-ink-muted">
            {q.word.word} — {q.word.definition}
            {q.word.example && <span className="italic"> “{q.word.example}”</span>}
          </p>
          <Button onClick={next} fullWidth>
            {index + 1 >= questions.length ? 'See results' : 'Next →'}
          </Button>
        </div>
      )}

      {toast && (
        <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
