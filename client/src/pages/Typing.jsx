import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { isCorrectSpelling } from '../utils/fuzzyMatch'
import { getSessionMessage } from '../utils/sessionMessages'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ModeTabs from '../components/ModeTabs'

const LENGTHS = [5, 10, 20]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Typing() {
  const { id } = useParams()
  const [deckTitle, setDeckTitle] = useState('')
  const [pool, setPool] = useState([])
  const [status, setStatus] = useState('loading') // loading|error|empty|idle|ready|done
  const [length, setLength] = useState(10)
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [answered, setAnswered] = useState(null) // {correct} after submit
  const [pending, setPending] = useState(null)
  const [saveError, setSaveError] = useState(false)
  const [results, setResults] = useState([])
  const [score, setScore] = useState(0)
  const [levelEvent, setLevelEvent] = useState(null)
  const [finalMessage, setFinalMessage] = useState(null)
  // Synchronous submit guard (see Practice.jsx busyRef): state flags are
  // stale across rapid double-submits, so the ref owns the lock
  const busyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    // Viewed-words pool, like quiz: typing tests recall, not first exposure
    api
      .get(`/decks/${id}/quiz?limit=50`)
      .then((data) => {
        if (cancelled) return
        setDeckTitle(data.deck.title)
        const viewed = data.words || []
        setPool(viewed)
        setStatus(viewed.length === 0 ? 'empty' : 'idle')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [id])

  function start() {
    setWords(shuffle(pool).slice(0, Math.min(length, pool.length)))
    setIndex(0)
    setValue('')
    setAnswered(null)
    setPending(null)
    setSaveError(false)
    setResults([])
    setScore(0)
    setLevelEvent(null)
    setFinalMessage(null)
    busyRef.current = false
    setStatus('ready')
  }

  async function saveAnswer(payload, word) {
    try {
      const data = await api.post('/progress/review', payload)
      setResults((r) => [...r, { word, correct: payload.correct }])
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

  async function submit(e) {
    e?.preventDefault()
    if (busyRef.current || answered || pending || !value.trim()) return
    const word = words[index]
    const correct = isCorrectSpelling(word.word, value)
    busyRef.current = true
    const payload = { wordId: word._id, correct }
    setPending(payload)
    setAnswered({ correct })
    await saveAnswer(payload, word.word)
  }

  async function retrySave() {
    if (!pending) return
    await saveAnswer(pending, words[index].word)
  }

  function next() {
    setValue('')
    setAnswered(null)
    setPending(null)
    setSaveError(false)
    busyRef.current = false
    if (index + 1 >= words.length) {
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
        Failed to load the typing session.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <EmptyState
        title="Practice first!"
        message="Typing tests words you've already seen. Run through the flashcards once, then come back and spell them."
        action={
          <Link to={`/decks/${id}`}>
            <Button>Practice this deck</Button>
          </Link>
        }
      />
    )
  }

  if (status === 'idle') {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Link to="/" className="inline-block text-sm text-slate-400 hover:text-primary">
          ← {deckTitle}
        </Link>
        <div className="flex justify-center">
          <ModeTabs deckId={id} />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary">Type the word</h1>
        <p className="text-sm text-slate-500">
          {pool.length} viewed word{pool.length === 1 ? '' : 's'} ready. Read the
          definition, spell the word — small typos are forgiven.
        </p>
        <div className="flex justify-center gap-2">
          {LENGTHS.map((n) => (
            <button
              key={n}
              onClick={() => setLength(n)}
              aria-pressed={length === n}
              className={`rounded-md px-5 py-2.5 font-display text-sm font-bold transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                length === n
                  ? 'bg-accent text-primary'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">{Math.min(length, pool.length)} words</p>
        <Button onClick={start}>Start typing</Button>
      </div>
    )
  }

  if (status === 'done') {
    const correctCount = results.filter((r) => r.correct).length
    const pct = results.length === 0 ? 0 : Math.round((correctCount / results.length) * 100)
    return (
      <div className="mx-auto max-w-2xl animate-page space-y-6 py-6 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">{finalMessage || 'Session complete!'}</h1>
        <p className="text-slate-500">
          You spelled {correctCount} of {results.length} right ({pct}%).
        </p>
        <div className="flex justify-center">
          <ModeTabs deckId={id} />
        </div>
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
            New session
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

  const word = words[index]

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-400 hover:text-primary">
          ← {deckTitle}
        </Link>
        <span className="text-slate-400">
          {index + 1} / {words.length} · ✓ {score}
        </span>
      </div>

      <div className="flex justify-center">
        <ModeTabs deckId={id} />
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {word.partOfSpeech || 'Spell this word'}
        </p>
        <p className="mt-2 text-lg font-semibold text-primary">{word.definition}</p>
        {word.example && (
          <p className="mt-1 text-sm italic text-slate-500">“{word.example}”</p>
        )}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={answered !== null}
          placeholder="Type the word…"
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Your spelling"
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-center text-xl font-semibold text-primary placeholder:font-normal placeholder:text-slate-300 focus:border-accent focus:outline-none disabled:bg-slate-50"
        />
        {!answered && (
          <Button type="submit" fullWidth disabled={!value.trim()}>
            Check spelling
          </Button>
        )}
      </form>

      {saveError && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 animate-pop">
          <span>Couldn&apos;t save that answer.</span>
          <button className="ml-auto underline" onClick={retrySave}>
            Retry
          </button>
        </div>
      )}

      {answered && !pending && (
        <div className="space-y-3">
          <div
            className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold animate-pop ${
              answered.correct
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {answered.correct ? (
              <span>
                ✓ Correct{value.trim().toLowerCase() !== word.word.toLowerCase() ? ' (typo forgiven!)' : '!'}
              </span>
            ) : (
              <span>
                ✗ The spelling is <span className="font-bold">{word.word}</span>
              </span>
            )}
          </div>
          <Button onClick={next} fullWidth>
            {index + 1 >= words.length ? 'See results' : 'Next →'}
          </Button>
        </div>
      )}

      {levelEvent && (
        <div className="animate-pop rounded-lg border-2 border-accent bg-gold px-4 py-2 text-center text-sm font-bold text-primary animate-glow">
          🎊 Level up! You reached Level {levelEvent.newLevel}
        </div>
      )}
    </div>
  )
}
