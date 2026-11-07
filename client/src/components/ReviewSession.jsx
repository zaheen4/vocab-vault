import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useInvalidateAfterReview } from '../api/queries'
import { getSessionMessage } from '../utils/sessionMessages'
import { shouldCelebrate } from '../utils/celebrate'
import { useStudyKeys } from '../utils/useStudyKeys'
import { useSlideDirection } from '../utils/navDirection'
import {
  speakWord,
  stopSpeaking,
  TTS_UNAVAILABLE_HINT,
  useTtsAvailable,
} from '../utils/speak'
import AnswerBar from './AnswerBar'
import Button from './ui/Button'
import SpeakerIcon from './ui/SpeakerIcon'
import Toast from './ui/Toast'
import EmptyState from './ui/EmptyState'
import Flashcard from './Flashcard'
import SessionHud from './SessionHud'
import SessionResults from './SessionResults'

const BOX_LABELS = { 1: 'Box 1', 2: 'Box 2', 3: 'Box 3', 4: 'Box 4', 5: 'Mastered' }

export default function ReviewSession({
  words: incomingWords,
  isLoading = false,
  isError = false,
  onRestart,
  title,
  subtitle,
  backTo,
  backLabel,
  emptyTitle,
  emptyMessage,
  emptyAction,
  emptyArt,
  resultsTitle,
  restartLabel = 'Review again',
  resultsActions,
}) {
  const invalidateAfterReview = useInvalidateAfterReview()
  const [pool, setPool] = useState(null)
  const words = pool ?? []
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [shake, setShake] = useState(false)
  const [sessionXp, setSessionXp] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [levelEvent, setLevelEvent] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [toast, setToast] = useState(null)
  const [finalMessage, setFinalMessage] = useState(null)
  const [newLearned, setNewLearned] = useState(0)
  const [caughtUp, setCaughtUp] = useState(0)
  const ttsAvailable = useTtsAvailable()
  const advanceTimer = useRef(null)
  const busyRef = useRef(false)
  const sessionRef = useRef({ correct: 0, total: 0, bestCombo: 0, levelUp: false, level: null })
  const slideCls = useSlideDirection()

  useEffect(() => {
    return () => {
      clearTimeout(advanceTimer.current)
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    if (pool === null && incomingWords) setPool(incomingWords)
  }, [incomingWords, pool])

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
    setCombo(0)
    setBestCombo(0)
    setLevelEvent(null)
    setConfetti(false)
    setToast(null)
    setFinalMessage(null)
    setNewLearned(0)
    setCaughtUp(0)
    busyRef.current = false
    sessionRef.current = { correct: 0, total: 0, bestCombo: 0, levelUp: false, level: null }
    onRestart?.()
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
      const resp = await api.post('/progress/review', { wordId: word._id, correct, mode: 'practice' })
      g = resp.gamification || {}
      box = resp.progress?.box || box
    } catch (err) {
      console.error(err)
      busyRef.current = false
      setSubmitting(false)
      setFeedback({ error: true })
      return
    }

    setResults((r) => [...r, { word: word.word, correct }])
    setScore((s) => s + (correct ? 1 : 0))
    const newCombo = correct ? combo + 1 : 0
    setCombo(newCombo)
    setBestCombo((b) => Math.max(b, newCombo))
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
    if (g.newBadges?.length) {
      const names = g.newBadges.map((b) => `${b.icon} ${b.name}`).join(' · ')
      setToast({ variant: 'gold', message: `Badge earned: ${names}!` })
    }
    invalidateAfterReview(undefined)

    setFlipped(true)
    if (!correct) setShake(true)
    setFeedback({
      correct,
      xpEarned: g.xpEarned,
      boxLabel: BOX_LABELS[box] || `Box ${box}`,
    })

    const finished = index + 1 >= words.length
    advanceTimer.current = setTimeout(() => {
      stopSpeaking()
      setShake(false)
      setFlipped(false)
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
    }, 900)
  }

  const current = words[index] ?? null
  useStudyKeys({
    enabled: !done && !!current,
    flipped,
    hasFeedback: !!feedback,
    onFlip: () => setFlipped((f) => !f),
    onAgain: () => answer(false),
    onGotIt: () => answer(true),
    onSpeak: () => current && speak(current.word),
  })

  if (isLoading || pool === null) {
    return (
      <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-xl border border-line bg-card" />
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-stamp/30 bg-stamp/10 p-4 text-center text-sm text-stamp">
        Failed to load this session.{' '}
        <Button variant="secondary" className="ml-2" onClick={onRestart}>
          Retry
        </Button>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="animate-page mx-auto max-w-2xl space-y-4">
        <Link to={backTo} className="inline-block text-sm text-ink-muted hover:text-ink">
          ← {backLabel}
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">
          {title}
        </h1>
        <EmptyState
          art={emptyArt}
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
        />
      </div>
    )
  }

  if (done) {
    const correctCount = results.filter((r) => r.correct).length
    return (
      <SessionResults
        confetti={confetti}
        message={finalMessage || resultsTitle}
        subtitle={`You got ${correctCount} of ${results.length} right · +${sessionXp} XP`}
        correct={correctCount}
        total={results.length}
        levelEvent={levelEvent}
        results={results}
        stats={[
          { label: 'XP earned', value: `+${sessionXp}` },
          { label: 'Best combo', value: bestCombo },
          { label: 'New words learned', value: newLearned },
          { label: 'Mastered', value: caughtUp },
        ]}
        actions={
          <>
            <Button variant="secondary" onClick={restart}>
              {restartLabel}
            </Button>
            {resultsActions}
          </>
        }
      />
    )
  }

  return (
    <div className={`mx-auto max-w-2xl space-y-4 py-2 ${slideCls}`}>
      <SessionHud
        backTo={backTo}
        backLabel={backLabel}
        index={index}
        total={words.length}
        score={score}
        combo={combo}
        sessionXp={sessionXp}
        actions={
          ttsAvailable !== null ? (
            <span
              title={ttsAvailable ? undefined : TTS_UNAVAILABLE_HINT}
              className={ttsAvailable ? '' : 'cursor-not-allowed'}
            >
              <Button
                variant="secondary"
                className="gap-1.5"
                aria-label={
                  ttsAvailable ? `Pronounce ${current.word}` : TTS_UNAVAILABLE_HINT
                }
                disabled={!ttsAvailable}
                onClick={() => speak(current.word)}
              >
                <SpeakerIcon />
                Say it
              </Button>
            </span>
          ) : null
        }
      />

      <div>
        <p className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
          {subtitle}
        </p>
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">
          {title}
        </h1>
      </div>

      <Flashcard
        word={current}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        shake={shake}
        reversed={false}
      />

      {flipped && !feedback && (
        <AnswerBar
          onAgain={() => answer(false)}
          onGotIt={() => answer(true)}
          disabled={submitting}
        />
      )}

      {feedback?.error && (
        <div className="animate-pop flex items-center justify-center gap-3 rounded-lg border border-stamp/30 bg-stamp/10 px-4 py-3 text-sm font-semibold text-stamp">
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
              ? 'border-sage/30 bg-sage/10 text-sage'
              : 'border-stamp/30 bg-stamp/10 text-stamp'
          }`}
        >
          <span className="text-lg">{feedback.correct ? '✓' : '✗'}</span>
          <span>
            {feedback.correct ? 'Nice!' : 'Keep going!'} → {feedback.boxLabel}
          </span>
          <span className="relative ml-auto font-mono tabular-nums">
            +{feedback.xpEarned} XP
            <span className="animate-float-up absolute -top-1 right-0 text-accent">
              +{feedback.xpEarned}
            </span>
          </span>
        </div>
      )}

      {toast && (
        <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
