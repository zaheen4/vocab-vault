import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { isStarred, useBookmarks, useInvalidateAfterReview, useQuizPool, useToggleBookmark } from '../api/queries'
import { useSlideDirection } from '../utils/navDirection'
import { isCorrectSpelling } from '../utils/fuzzyMatch'
import { getSessionMessage } from '../utils/sessionMessages'
import Button from '../components/ui/Button'
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

export default function Typing() {
  const { id } = useParams()
  const { data: poolData, isLoading, isError } = useQuizPool(id)
  const invalidateAfterReview = useInvalidateAfterReview()
  const { data: bookmarks = [] } = useBookmarks()
  const toggleBookmark = useToggleBookmark()
  const deckTitle = poolData?.title || ''
  const pool = poolData?.words ?? []
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
  const [toast, setToast] = useState(null)
  const [finalMessage, setFinalMessage] = useState(null)
  const slideCls = useSlideDirection()
  // Synchronous submit guard (see Practice.jsx busyRef): state flags are
  // stale across rapid double-submits, so the ref owns the lock
  const busyRef = useRef(false)

  useEffect(() => {
    if (isLoading) {
      setStatus('loading')
      return
    }
    if (isError) {
      setStatus('error')
      return
    }
    setStatus((s) => (s === 'loading' ? (pool.length === 0 ? 'empty' : 'idle') : s))
  }, [isLoading, isError, pool])

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
    setToast(null)
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
      if (data.gamification?.newBadges?.length) {
        const names = data.gamification.newBadges.map((b) => `${b.icon} ${b.name}`).join(' · ')
        setToast({ variant: 'gold', message: `🏅 Badge earned: ${names}!` })
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
    return <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-slate-200 dark:bg-night-800" />
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
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
        art={<EmptyArt variant="review" />}
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
      <div className={`mx-auto max-w-xl space-y-4 text-center ${slideCls}`}>
        <Link to="/" className="inline-block text-sm text-slate-400 hover:text-primary dark:text-cream-300/60 dark:hover:text-cream-100">
          ← {deckTitle}
        </Link>
        <div className="flex justify-center">
          <DeckTile id={id} title={deckTitle} size="lg" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">Type the word</h1>
        <p className="text-sm text-slate-500 dark:text-cream-300/80">
          {pool.length} viewed word{pool.length === 1 ? '' : 's'} ready. Read the
          definition, spell the word — small typos are forgiven.
        </p>
        <div className="flex justify-center gap-2">
          {LENGTHS.map((n) => (
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
        <p className="text-xs text-slate-400 dark:text-cream-300/60">{Math.min(length, pool.length)} words</p>
        <Button onClick={start}>Start typing</Button>
      </div>
    )
  }

  if (status === 'done') {
    const correctCount = results.filter((r) => r.correct).length
    const pct = results.length === 0 ? 0 : Math.round((correctCount / results.length) * 100)
    return (
      <div className="animate-page mx-auto max-w-2xl space-y-6 py-6 text-center">
        <h1 className="font-display text-3xl font-bold text-primary dark:text-cream-100">{finalMessage || 'Session complete!'}</h1>
        <p className="text-slate-500 dark:text-cream-300/80">
          You spelled {correctCount} of {results.length} right ({pct}%).
        </p>
        {results.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {results.map((r, i) => (
              <span
                key={i}
                title={r.word}
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  r.correct
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300'
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
    <div className={`mx-auto max-w-xl space-y-4 ${slideCls}`}>
      <div className="flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-400 hover:text-primary dark:text-cream-300/60 dark:hover:text-cream-100">
          ← {deckTitle}
        </Link>
        <span className="flex items-center gap-2 text-slate-400 dark:text-cream-300/60">
          <span>
            {index + 1} / {words.length} · ✓ {score}
          </span>
          <Button
            variant="secondary"
            aria-label={isStarred(bookmarks, word._id) ? `Remove ${word.word} from saved` : `Save ${word.word}`}
            aria-pressed={isStarred(bookmarks, word._id)}
            onClick={() =>
              toggleBookmark.mutate(
                { wordId: word._id, starred: isStarred(bookmarks, word._id) },
                { onError: () => setToast({ variant: 'error', message: "Couldn't save that word." }) }
              )
            }
          >
            {isStarred(bookmarks, word._id) ? '★' : '☆'}
          </Button>
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-night-800">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-cream-300/70">
          {word.partOfSpeech || 'Spell this word'}
        </p>
        <p className="mt-2 text-lg leading-relaxed font-semibold text-primary dark:text-cream-100">{word.definition}</p>
        {word.example && (
          <p className="mt-1 text-sm text-slate-500 italic dark:text-cream-300/80">“{word.example}”</p>
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
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-center text-xl font-semibold text-primary placeholder:font-normal placeholder:text-slate-300 focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none disabled:bg-slate-50 dark:border-white/15 dark:bg-night-800 dark:text-cream-100 dark:placeholder:text-cream-300/40 dark:disabled:bg-night-900"
        />
        {!answered && (
          <Button type="submit" fullWidth disabled={!value.trim()}>
            Check spelling
          </Button>
        )}
      </form>

      {saveError && (
        <div className="animate-pop flex items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-950/50 dark:text-red-300">
          <span>Couldn&apos;t save that answer.</span>
          <button className="ml-auto underline" onClick={retrySave}>
            Retry
          </button>
        </div>
      )}

      {answered && !pending && (
        <div className="space-y-3">
          <div
            className={`animate-pop rounded-lg border px-4 py-3 text-center text-sm font-semibold ${
              answered.correct
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-950/50 dark:text-red-300'
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
        <div className="animate-pop animate-glow rounded-lg border-2 border-accent bg-gold px-4 py-2 text-center text-sm font-bold text-primary dark:bg-accent/15 dark:text-accent">
          🎊 Level up! You reached Level {levelEvent.newLevel}
        </div>
      )}

      {toast && (
        <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
