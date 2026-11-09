import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { isStarred, useBookmarks, useInvalidateAfterReview, useQuizPool, useToggleBookmark } from '../api/queries'
import { useSlideDirection } from '../utils/navDirection'
import { isCorrectSpelling } from '../utils/fuzzyMatch'
import { getSessionMessage } from '../utils/sessionMessages'
import { shouldCelebrate } from '../utils/celebrate'
import Button from '../components/ui/Button'
import LevelUpBanner from '../components/LevelUpBanner'
import Input from '../components/ui/Input'
import SessionResults from '../components/SessionResults'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import Toast from '../components/ui/Toast'
import SessionStatus from '../components/study/SessionStatus'
import StudyStage from '../components/study/StudyStage'

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
  const [searchParams] = useSearchParams()
  const partParam = searchParams.get('part')
  const part = partParam ? Number(partParam) : undefined
  const { data: poolData, isLoading, isError } = useQuizPool(id, 50, 'viewed', part)
  const invalidateAfterReview = useInvalidateAfterReview()
  const { data: bookmarks = [] } = useBookmarks()
  const toggleBookmark = useToggleBookmark()
  const pool = useMemo(() => poolData?.words ?? [], [poolData])
  const [status, setStatus] = useState('loading')
  const [length, setLength] = useState(10)
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [answered, setAnswered] = useState(null)
  const [pending, setPending] = useState(null)
  const [saveError, setSaveError] = useState(false)
  const [results, setResults] = useState([])
  const [score, setScore] = useState(0)
  const [levelEvent, setLevelEvent] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [toast, setToast] = useState(null)
  const [finalMessage, setFinalMessage] = useState(null)
  const slideCls = useSlideDirection()
  const busyRef = useRef(false)

  useEffect(() => {
    setStatus('loading')
    setWords([])
    setIndex(0)
    setValue('')
    setAnswered(null)
    setPending(null)
    setSaveError(false)
    setResults([])
    setScore(0)
    setLevelEvent(null)
    setConfetti(false)
    setToast(null)
    setFinalMessage(null)
    busyRef.current = false
  }, [id, part])

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
    setConfetti(false)
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

  async function submit(e) {
    e?.preventDefault()
    if (busyRef.current || answered || pending || !value.trim()) return
    const word = words[index]
    const correct = isCorrectSpelling(word.word, value)
    busyRef.current = true
    const payload = { wordId: word._id, correct, mode: 'typing' }
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
      setStatus('done')
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (status === 'loading') {
    return <div className="h-64 animate-pulse rounded-xl border border-line bg-card" />
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-stamp/30 bg-stamp/10 p-4 text-center text-sm text-stamp">
        Failed to load the typing session.{' '}
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
      <div className={`flex min-h-0 flex-1 flex-col ${slideCls}`}>
        <StudyStage>
          <div className="my-auto rounded-xl border-2 border-line bg-card p-5 shadow-paper dark:shadow-none">
            <p className="font-mono text-3xs font-bold tracking-widest text-ink-muted uppercase">
              Type the word
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              {pool.length} viewed word{pool.length === 1 ? '' : 's'} ready. Read the
              definition, spell the word — small typos are forgiven.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {LENGTHS.map((n) => (
                <Button
                  key={n}
                  variant={length === n ? 'primary' : 'secondary'}
                  onClick={() => setLength(n)}
                  aria-pressed={length === n}
                  className="min-w-12"
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {Math.min(length, pool.length)} words
            </p>
            <Button className="mt-4" onClick={start}>
              Start typing
            </Button>
          </div>
        </StudyStage>
      </div>
    )
  }

  if (status === 'done') {
    const correctCount = results.filter((r) => r.correct).length
    const pct = results.length === 0 ? 0 : Math.round((correctCount / results.length) * 100)
    return (
      <SessionResults
        confetti={confetti}
        message={finalMessage || 'Session complete!'}
        subtitle={`You spelled ${correctCount} of ${results.length} right (${pct}%).`}
        correct={correctCount}
        total={results.length}
        results={results}
        actions={
          <>
            <Button variant="secondary" onClick={() => setStatus('idle')}>
              New session
            </Button>
            <Link to={`/decks/${id}`}>
              <Button variant="secondary">Practice flashcards</Button>
            </Link>
            <Link to="/">
              <Button>Back to decks</Button>
            </Link>
          </>
        }
      />
    )
  }

  const word = words[index]
  const starred = isStarred(bookmarks, word._id)

  const footer = answered && !pending ? (
    <div className="flex w-full items-center gap-3">
      <div
        className={`min-w-0 flex-1 truncate rounded-lg border px-3 py-2 text-sm font-semibold ${
          answered.correct
            ? 'border-sage/30 bg-sage/10 text-sage'
            : 'border-stamp/30 bg-stamp/10 text-stamp'
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
      <Button onClick={next} className="shrink-0">
        {index + 1 >= words.length ? 'See results' : 'Next →'}
      </Button>
    </div>
  ) : saveError ? (
    <div className="flex w-full items-center gap-3 rounded-lg border border-stamp/30 bg-stamp/10 px-4 py-3 text-sm font-semibold text-stamp">
      <span>Couldn&apos;t save that answer.</span>
      <button type="button" className="ml-auto underline" onClick={retrySave}>
        Retry
      </button>
    </div>
  ) : null

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${slideCls}`}>
      <StudyStage
        status={
          <SessionStatus
            index={index}
            total={words.length}
            score={score}
            actions={
              <Button
                variant="secondary"
                className="min-h-11 px-2.5 text-xs"
                aria-label={starred ? `Remove ${word.word} from saved` : `Save ${word.word}`}
                aria-pressed={starred}
                onClick={() =>
                  toggleBookmark.mutate(
                    { wordId: word._id, starred },
                    { onError: () => setToast({ variant: 'error', message: "Couldn't save that word." }) }
                  )
                }
              >
                {starred ? '★' : '☆'}
              </Button>
            }
          />
        }
        footer={footer}
        notice={levelEvent ? <LevelUpBanner level={levelEvent.newLevel} /> : null}
      >
        <div className="my-auto flex flex-col gap-2">
          <div className="rounded-xl border-2 border-line bg-card p-6 text-center shadow-paper dark:shadow-none">
            <p className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
              {word.partOfSpeech || 'Spell this word'}
            </p>
            <p className="mt-2 text-lg leading-relaxed font-medium text-ink">{word.definition}</p>
            {word.example && (
              <p className="mt-2 text-sm text-ink-muted italic">“{word.example}”</p>
            )}
          </div>

          <form onSubmit={submit} className="space-y-2">
            <Input
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
              inputClassName={`rounded-lg border-2 px-4 py-3 text-center text-xl font-semibold${answered && !answered.correct ? ' animate-shake' : ''}`}
            />
            {!answered && (
              <Button type="submit" fullWidth disabled={!value.trim()}>
                Check spelling
              </Button>
            )}
          </form>
        </div>
      </StudyStage>

      {toast && (
        <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
