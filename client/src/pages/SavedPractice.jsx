import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useInvalidateAfterReview, useSavedPracticeSession } from '../api/queries'
import { useSlideDirection } from '../utils/navDirection'
import { getSessionMessage } from '../utils/sessionMessages'
import { shouldCelebrate } from '../utils/celebrate'
import { speakWord, stopSpeaking, TTS_UNAVAILABLE_HINT, useTtsAvailable } from '../utils/speak'
import Button from '../components/ui/Button'
import SpeakerIcon from '../components/ui/SpeakerIcon'
import Toast from '../components/ui/Toast'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import Confetti from '../components/Confetti'
import Flashcard from '../components/Flashcard'
import ScoreRing from '../components/ScoreRing'

const BOX_LABELS = { 1: 'Box 1', 2: 'Box 2', 3: 'Box 3', 4: 'Box 4', 5: 'Mastered' }

// Flashcard session over saved words (no deck): unseen saved words first,
// then due ones. Records through the standard review endpoint.
export default function SavedPractice() {
  const { data: sessionWords, isLoading, isError, refetch } = useSavedPracticeSession(10)
  const invalidateAfterReview = useInvalidateAfterReview()
  const [pool, setPool] = useState(null)
  const words = pool ?? []
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [sessionXp, setSessionXp] = useState(0)
  const [score, setScore] = useState(0)
  const [levelEvent, setLevelEvent] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [toast, setToast] = useState(null)
  const [finalMessage, setFinalMessage] = useState(null)
  const ttsAvailable = useTtsAvailable()
  const advanceTimer = useRef(null)
  const busyRef = useRef(false)
  const sessionRef = useRef({ correct: 0, total: 0, levelUp: false, level: null })
  const slideCls = useSlideDirection()

  useEffect(() => {
    return () => {
      clearTimeout(advanceTimer.current)
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    if (pool === null && sessionWords) setPool(sessionWords)
  }, [sessionWords, pool])

  function restart() {
    stopSpeaking()
    setPool(null)
    setIndex(0)
    setFlipped(false)
    setDone(false)
    setResults([])
    setSubmitting(false)
    setFeedback(null)
    setSessionXp(0)
    setScore(0)
    setLevelEvent(null)
    setConfetti(false)
    setToast(null)
    setFinalMessage(null)
    busyRef.current = false
    sessionRef.current = { correct: 0, total: 0, levelUp: false, level: null }
    refetch()
  }

  function speak(text) {
    speakWord(text, {
      onError: () => setToast({ variant: 'error', message: "Couldn't play the pronunciation." }),
    })
  }

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
      busyRef.current = false
      setSubmitting(false)
      setFeedback({ error: true })
      return
    }

    setResults((r) => [...r, { word: word.word, correct }])
    setScore((s) => s + (correct ? 1 : 0))
    const ref = sessionRef.current
    ref.correct += correct ? 1 : 0
    ref.total += 1
    ref.levelUp = ref.levelUp || !!g.levelUp
    if (g.level != null) ref.level = g.level
    setSessionXp((x) => x + (g.xpEarned || 0))
    if (g.levelUp) setLevelEvent({ newLevel: g.level, xp: g.xp })
    if (g.newBadges?.length) {
      const names = g.newBadges.map((b) => `${b.icon} ${b.name}`).join(' · ')
      setToast({ variant: 'gold', message: `🏅 Badge earned: ${names}!` })
    }
    invalidateAfterReview(undefined)

    setFlipped(false)
    setFeedback({
      correct,
      xpEarned: g.xpEarned,
      boxLabel: BOX_LABELS[box] || `Box ${box}`,
    })

    const finished = index + 1 >= words.length
    advanceTimer.current = setTimeout(() => {
      stopSpeaking()
      setFeedback(null)
      setSubmitting(false)
      busyRef.current = false
      clearTimeout(advanceTimer.current)
      if (finished) {
        const s = sessionRef.current
        if (shouldCelebrate({ correct: s.correct, total: s.total, levelUp: s.levelUp })) {
          setConfetti(true)
        }
        setFinalMessage(
          getSessionMessage({ correct: s.correct, total: s.total, levelUp: s.levelUp, level: s.level })
        )
        setDone(true)
      } else {
        setIndex((i) => i + 1)
      }
    }, 900)
  }

  if (isLoading || pool === null) {
    return <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-slate-200 dark:bg-night-800" />
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
        Failed to load saved words.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="animate-page mx-auto max-w-xl space-y-4">
        <Link to="/bookmarks" className="inline-block text-sm text-slate-400 hover:text-primary dark:text-cream-300/60 dark:hover:text-cream-100">
          ← Saved words
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">Review saved</h1>
        <EmptyState
        art={<EmptyArt variant="saved" />}
          title="Nothing due right now"
          message="Star some words, or come back when your saved reviews are due."
          action={
            <Link to="/bookmarks">
              <Button>Back to saved</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (done) {
    const correctCount = results.filter((r) => r.correct).length
    return (
      <div className="animate-page mx-auto max-w-xl space-y-4 text-center">
        {confetti && <Confetti active={confetti} pieces={70} />}
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">{finalMessage || 'Session complete!'}</h1>
        <p className="text-slate-500 dark:text-cream-300/80">
          You got {correctCount} of {results.length} right · +{sessionXp} XP
        </p>
        <ScoreRing correct={correctCount} total={results.length} />
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={restart}>
            Review again
          </Button>
          <Link to="/bookmarks">
            <Button>Back to saved</Button>
          </Link>
        </div>
      </div>
    )
  }

  const current = words[index]

  return (
    <div className={`mx-auto max-w-xl space-y-4 ${slideCls}`}>
      <div className="flex items-center justify-between text-sm">
        <Link to="/bookmarks" className="text-slate-400 hover:text-primary dark:text-cream-300/60 dark:hover:text-cream-100">
          ← Saved words
        </Link>
        <span className="text-slate-400 dark:text-cream-300/60">
          {index + 1} / {words.length} · ✓ {score}
        </span>
      </div>

      <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">Review saved</h1>

      <div className="flex justify-end gap-2">
        {ttsAvailable !== null && (
          <span
            title={ttsAvailable ? undefined : TTS_UNAVAILABLE_HINT}
            className={ttsAvailable ? '' : 'cursor-not-allowed'}
          >
            <Button
              variant="secondary"
              className="gap-1.5"
              aria-label={ttsAvailable ? `Pronounce ${current.word}` : TTS_UNAVAILABLE_HINT}
              disabled={!ttsAvailable}
              onClick={() => speak(current.word)}
            >
              <SpeakerIcon />
              Say it
            </Button>
          </span>
        )}
      </div>

      <Flashcard
        word={current}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        shake={false}
        reversed={false}
      />

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
        <div className="animate-pop flex items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-950/50 dark:text-red-300">
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
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-950/50 dark:text-red-300'
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
