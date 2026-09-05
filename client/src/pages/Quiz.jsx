import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { getSessionMessage } from '../utils/sessionMessages'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

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

export default function Quiz() {
  const { id } = useParams()
  const [deckTitle, setDeckTitle] = useState('')
  const [pool, setPool] = useState([])
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
  const [finalMessage, setFinalMessage] = useState(null)
  // Synchronous submit guard (see Practice.jsx busyRef): state flags are
  // stale across rapid double-clicks, so the ref owns the lock
  const busyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    api
      .get(`/decks/${id}`)
      .then((data) => {
        if (cancelled) return
        setDeckTitle(data.deck.title)
        const words = data.deck.wordIds || []
        setPool(words)
        setStatus(words.length === 0 ? 'empty' : 'idle')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [id])

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
    setQuestions(buildQuestions(pool, fallback, length))
    setIndex(0)
    setPicked(null)
    setPending(null)
    setSaveError(false)
    setResults([])
    setScore(0)
    setLevelEvent(null)
    setFinalMessage(null)
    busyRef.current = false
    setStatus('ready')
  }

  async function saveAnswer(payload) {
    try {
      const data = await api.post('/progress/review', payload)
      setResults((r) => [...r, { word: questions[index].word.word, correct: payload.correct }])
      if (payload.correct) setScore((s) => s + 1)
      if (data.gamification?.levelUp) setLevelEvent({ newLevel: data.gamification.level })
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
    const payload = { wordId: q.word._id, correct }
    setPicked(optIdx)
    setPending(payload)
    await saveAnswer(payload)
  }

  async function retrySave() {
    if (!pending) return
    await saveAnswer(pending)
  }

  function next() {
    setPicked(null)
    setPending(null)
    setSaveError(false)
    busyRef.current = false
    if (index + 1 >= questions.length) {
      const correctCount = results.filter((r) => r.correct).length
      setFinalMessage(
        getSessionMessage({
          correct: correctCount,
          total: results.length,
          levelUp: !!levelEvent,
          level: levelEvent?.newLevel ?? null,
        })
      )
      setStatus('done')
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (status === 'loading') {
    return <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-slate-200" />
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        Failed to load the quiz.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <EmptyState
        title="No words in this deck yet"
        message="Add words to this deck before starting a quiz."
      />
    )
  }

  if (status === 'idle') {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Link to="/" className="inline-block text-sm text-slate-400 hover:text-primary">
          ← {deckTitle}
        </Link>
        <h1 className="text-2xl font-bold text-primary">Quiz yourself</h1>
        <p className="text-sm text-slate-500">
          {pool.length} word{pool.length === 1 ? '' : 's'} in this deck. Pick a
          definition for each word — every answer is recorded like practice.
        </p>
        <div className="flex justify-center gap-2">
          {LENGTHS.map((n) => (
            <button
              key={n}
              onClick={() => setLength(n)}
              aria-pressed={length === n}
              className={`rounded-md px-5 py-2.5 text-sm font-semibold transition-colors ${
                length === n
                  ? 'bg-accent text-primary'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          {Math.min(length, pool.length)} questions
        </p>
        <Button onClick={start}>Start quiz</Button>
      </div>
    )
  }

  if (status === 'done') {
    const correctCount = results.filter((r) => r.correct).length
    const pct = results.length === 0 ? 0 : Math.round((correctCount / results.length) * 100)
    return (
      <div className="mx-auto max-w-2xl animate-page space-y-6 py-6 text-center">
        <h1 className="text-3xl font-bold text-primary">{finalMessage || 'Quiz complete!'}</h1>
        <p className="text-slate-500">
          You scored {correctCount} of {results.length} ({pct}%).
        </p>
        {results.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {results.map((r, i) => (
              <span
                key={i}
                title={r.word}
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  r.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {r.correct ? '✓' : '✗'}
              </span>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => setStatus('idle')}>
            New quiz
          </Button>
          <Link to={`/decks/${id}`}>
            <Button variant="secondary">Practice flashcards</Button>
          </Link>
          <Link to="/">
            <Button>Back to decks</Button>
          </Link>
        </div>
      </div>
    )
  }

  const q = questions[index]
  const answered = picked !== null && !pending

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-400 hover:text-primary">
          ← {deckTitle}
        </Link>
        <span className="text-slate-400">
          {index + 1} / {questions.length} · ✓ {score}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {q.word.partOfSpeech || 'What does this mean?'}
        </p>
        <h2 className="mt-1 text-3xl font-bold text-primary">{q.word.word}</h2>
      </div>

      <div className="grid grid-cols-1 gap-2" key={q.word._id}>
        {q.options.map((opt, i) => {
          let cls = 'border-slate-200 bg-white hover:border-accent hover:bg-gold/40'
          if (picked !== null) {
            if (i === q.answerIndex) cls = 'border-emerald-300 bg-emerald-50 text-emerald-800'
            else if (i === picked) cls = 'border-red-300 bg-red-50 text-red-700'
            else cls = 'border-slate-200 bg-white opacity-50'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              style={picked === null ? { animationDelay: `${i * 50}ms` } : undefined}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium text-primary transition-colors disabled:cursor-default ${picked === null ? 'animate-fade-up' : ''} ${cls}`}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
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
        <div className="flex items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 animate-pop">
          <span>Couldn&apos;t save that answer.</span>
          <button className="ml-auto underline" onClick={retrySave}>
            Retry
          </button>
        </div>
      )}

      {answered && (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-500">
            {q.word.word} — {q.word.definition}
            {q.word.example && <span className="italic"> “{q.word.example}”</span>}
          </p>
          <Button onClick={next} fullWidth>
            {index + 1 >= questions.length ? 'See results' : 'Next →'}
          </Button>
        </div>
      )}
    </div>
  )
}
