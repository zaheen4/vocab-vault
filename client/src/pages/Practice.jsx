import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useDeck, useInvalidateAfterReview, usePracticeSession } from '../api/queries'
import { useSlideDirection } from '../utils/navDirection'
import { useAuth } from '../context/AuthContext'
import { getSessionMessage } from '../utils/sessionMessages'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Confetti from '../components/Confetti'

const BOX_LABELS = { 1: 'Box 1', 2: 'Box 2', 3: 'Box 3', 4: 'Box 4', 5: 'Mastered' }

function Flashcard({ word, flipped, onFlip, shake }) {
  return (
    <div className={`flip-scene w-full ${shake ? 'animate-shake' : ''}`}>
      <button
        onClick={onFlip}
        className="flip-scene block w-full"
        aria-pressed={flipped}
        aria-label={flipped ? `Definition of ${word.word}` : `Word ${word.word}, tap to reveal`}
      >
        <span className={`flip-inner relative flex min-h-64 w-full ${flipped ? 'flipped' : ''}`}>
          <span className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-3xl font-bold text-primary">{word.word}</h2>
            {word.partOfSpeech && (
              <p className="mt-1 text-sm text-slate-400 italic">{word.partOfSpeech}</p>
            )}
            <p className="pt-4 text-xs tracking-wide text-slate-300 uppercase">Tap to reveal</p>
          </span>
          <span className="flip-back flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              {word.word}
              {word.partOfSpeech && ` · ${word.partOfSpeech}`}
            </p>
            <p className="mt-2 text-lg font-semibold text-primary">{word.definition}</p>
            {word.example && (
              <p className="mt-1 text-sm text-slate-500 italic">“{word.example}”</p>
            )}
            {word.synonyms?.length > 0 && (
              <p className="mt-1 text-sm text-slate-400">Synonyms: {word.synonyms.join(', ')}</p>
            )}
          </span>
        </span>
      </button>
    </div>
  )
}

// A count-up number for the end screen
function ScoreRing({ correct, total }) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const r = 52
  const c = 2 * Math.PI * r
  const filled = (pct / 100) * c
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-slate-200)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={
            pct >= 70
              ? 'var(--color-emerald-400)'
              : pct >= 40
                ? 'var(--color-accent)'
                : 'var(--color-red-400)'
          }
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-primary">{pct}%</span>
        <span className="text-xs text-slate-400">
          {correct}/{total}
        </span>
      </div>
    </div>
  )
}

export default function Practice() {
  const { id } = useParams()
  const { user } = useAuth()
  // Session pool revalidates on every mount (staleTime 0) but paints the
  // prefetched cache instantly; deck title is long-lived cache.
  const { data: deck } = useDeck(id)
  const { data: sessionWords, isLoading, isError } = usePracticeSession(id, 10)
  const invalidateAfterReview = useInvalidateAfterReview()
  const deckTitle = deck?.title || ''
  const words = sessionWords ?? []
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [sessionXp, setSessionXp] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [levelEvent, setLevelEvent] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [newLearned, setNewLearned] = useState(0)
  const [caughtUp, setCaughtUp] = useState(0)
  const advanceTimer = useRef(null)
  const [shake, setShake] = useState(false)
  // Synchronous submit guard: state-based `submitting` is stale within rapid
  // double-clicks (no re-render between them), so a ref owns the lock
  const busyRef = useRef(false)
  // Session totals mirrored in a ref so the end-of-session message can be
  // computed exactly once inside the advance timer (no render-phase side effects)
  const sessionRef = useRef({ correct: 0, total: 0, bestCombo: 0, levelUp: false, level: null })
  const [finalMessage, setFinalMessage] = useState(null)
  const slideCls = useSlideDirection()

  // Timer cleanup only — data comes from the session query above.
  // (advanceTimer is read inside cleanup so the latest timer is cleared.)
  useEffect(() => {
    return () => clearTimeout(advanceTimer.current)
  }, [])
  // Fresh session state per deck (query key change remounts data, not UI).
  useEffect(() => {
    setIndex(0)
    setFlipped(false)
    setDone(false)
    setResults([])
    setSubmitting(false)
    setSessionXp(0)
    setCombo(0)
    setBestCombo(0)
    setScore(0)
    setFeedback(null)
    setLevelEvent(null)
    setConfetti(false)
    setNewLearned(0)
    setCaughtUp(0)
    setFinalMessage(null)
    busyRef.current = false
    sessionRef.current = { correct: 0, total: 0, bestCombo: 0, levelUp: false, level: null }
  }, [id])

  async function answer(correct) {
    if (busyRef.current || submitting || feedback) return
    busyRef.current = true
    const word = words[index]
    setSubmitting(true)

    let g = {}
    let box = correct ? 2 : 1
    try {
      const data = await api.post('/progress/review', { wordId: word._id, correct })
      g = data.gamification || {}
      box = data.progress?.box || box
    } catch (err) {
      console.error(err)
      // Don't record the result — let the user retry instead of losing progress
      busyRef.current = false
      setSubmitting(false)
      setFeedback({ error: true })
      return
    }

    // Only committed once the server has recorded the review
    setResults((r) => [...r, { word: word.word, correct }])

    // live HUD
    const newCombo = correct ? combo + 1 : 0
    setCombo(newCombo)
    setBestCombo((b) => Math.max(b, newCombo))
    setScore((s) => s + (correct ? 1 : 0))
    const ref = sessionRef.current
    ref.correct += correct ? 1 : 0
    ref.total += 1
    ref.bestCombo = Math.max(ref.bestCombo, newCombo)
    ref.levelUp = ref.levelUp || !!g.levelUp
    if (g.level != null) ref.level = g.level
    setSessionXp((x) => x + (g.xpEarned || 0))
    if (g.newWordsLearned) setNewLearned((n) => n + g.newWordsLearned)
    if (g.reviewsCaughtUp) setCaughtUp((n) => n + g.reviewsCaughtUp)
    if (g.levelUp) setLevelEvent({ newLevel: g.level, xp: g.xp })
    invalidateAfterReview(id)

    setFlipped(false)
    if (!correct) setShake(true)

    setFeedback({
      correct,
      xpEarned: g.xpEarned,
      boxLabel: BOX_LABELS[box] || `Box ${box}`,
    })

    const finished = index + 1 >= words.length
    advanceTimer.current = setTimeout(() => {
      setShake(false)
      setFeedback(null)
      setSubmitting(false)
      busyRef.current = false
      clearTimeout(advanceTimer.current)
      if (finished) {
        setConfetti(true)
        const s = sessionRef.current
        setFinalMessage(
          getSessionMessage({
            correct: s.correct,
            total: s.total,
            bestCombo: s.bestCombo,
            levelUp: s.levelUp,
            level: s.level,
          })
        )
        setDone(true)
      } else {
        setIndex((i) => i + 1)
      }
    }, 850)
  }

  if (isLoading) {
    return <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-slate-200" />
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        Failed to load the practice session.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <EmptyState
        title="No words due right now"
        message="Everything here is scheduled for review. Come back tomorrow to keep your streak going and earn more XP!"
      />
    )
  }

  if (done) {
    const correctCount = results.filter((r) => r.correct).length
    const firstName = user?.name?.split(' ')[0]
    return (
      <div className="animate-page mx-auto max-w-2xl space-y-6 py-6 text-center">
        <Confetti active={confetti} pieces={70} />
        <h1 className="font-display text-3xl font-bold text-primary">
          {finalMessage || 'Session complete! 🎉'}
        </h1>
        {firstName && (
          <p className="-mt-3 text-slate-500">
            {firstName}, you got {correctCount} of {results.length} right.
          </p>
        )}
        {levelEvent && (
          <div className="animate-pop animate-glow mx-auto max-w-sm rounded-xl border-2 border-accent bg-gold px-4 py-3 text-primary">
            <span className="text-sm font-bold">🎊 Level up! You reached Level {levelEvent.newLevel}</span>
          </div>
        )}
        <ScoreRing correct={correctCount} total={results.length} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-accent">+{sessionXp}</p>
            <p className="text-xs text-slate-400">XP earned</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-primary">{bestCombo}🔥</p>
            <p className="text-xs text-slate-400">Best combo</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-emerald-600">{newLearned}</p>
            <p className="text-xs text-slate-400">New words learned</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-violet-600">{caughtUp}</p>
            <p className="text-xs text-slate-400">Mastered</p>
          </div>
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
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Practice again
          </Button>
          <Link to="/">
            <Button>Back to decks</Button>
          </Link>
        </div>
      </div>
    )
  }

  const current = words[index]

  return (
    <div className={`mx-auto max-w-xl space-y-4 ${slideCls}`}>
      {/* HUD */}
      <div className="flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-400 hover:text-primary">
          ← {deckTitle}
        </Link>
        <span className="text-sm text-slate-400">
          {index + 1} / {words.length}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">
        <span className="text-primary">✓ {score}</span>
        {combo >= 2 && (
          <span className="animate-pop rounded-full bg-accent px-2 py-0.5 text-primary">
            {combo} combo 🔥
          </span>
        )}
        <span className="ml-auto rounded bg-gold px-2 py-0.5 text-primary">+{sessionXp} XP</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      <Flashcard word={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} shake={shake} />

      {flipped && !feedback && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => answer(false)} fullWidth disabled={submitting} chunky>
            Not yet
          </Button>
          <Button variant="success" onClick={() => answer(true)} fullWidth disabled={submitting} chunky>
            Got it
          </Button>
        </div>
      )}

      {feedback?.error && (
        <div className="animate-pop flex items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <span>Couldn&apos;t save that review. Check your connection and try again.</span>
          <button className="ml-auto underline" onClick={() => setFeedback(null)}>
            Dismiss
          </button>
        </div>
      )}

      {feedback && !feedback.error && (
        <div
          className={`animate-pop flex items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${
            feedback.correct
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span className="text-lg">{feedback.correct ? '✓' : '✗'}</span>
          <span>
            {feedback.correct ? 'Nice!' : 'Keep going!'} → {feedback.boxLabel}
          </span>
          <span className="relative ml-auto text-accent">
            +{feedback.xpEarned} XP
            <span className="animate-float-up absolute -top-1 right-0 text-accent">+{feedback.xpEarned}</span>
          </span>
        </div>
      )}

      {levelEvent && (
        <div className="animate-pop animate-glow rounded-lg border-2 border-accent bg-gold px-4 py-2 text-center text-sm font-bold text-primary">
          🎊 Level up! You reached Level {levelEvent.newLevel}
        </div>
      )}
    </div>
  )
}
