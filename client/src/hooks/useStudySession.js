import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { useInvalidateAfterReview } from '../api/queries'
import { shouldCelebrate } from '../utils/celebrate'
import { getSessionMessage } from '../utils/sessionMessages'
import {
  claimTtsTip,
  speakWord,
  stopSpeaking,
  useTtsAvailable,
} from '../utils/speak'
import {
  boxLabel,
  initialSessionTally,
  sessionMessageInput,
  tallyAnswer,
} from '../utils/studySession'

export function useStudySession({
  words: incomingWords,
  resetKey,
  active = true,
  advanceMs = 850,
  mode = 'practice',
  invalidateKey,
  onRestart,
  tipOnFirstSpeak = false,
} = {}) {
  const invalidateAfterReview = useInvalidateAfterReview()
  const ttsAvailable = useTtsAvailable()

  const [pool, setPool] = useState(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shake, setShake] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [tally, setTally] = useState(initialSessionTally)
  const [toast, setToast] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [finalMessage, setFinalMessage] = useState(null)

  const advanceTimer = useRef(null)
  const busyRef = useRef(false)
  const resetRef = useRef(resetKey)

  const words = useMemo(() => pool ?? [], [pool])
  const current = words[index] ?? null

  const reset = useCallback(() => {
    clearTimeout(advanceTimer.current)
    advanceTimer.current = null
    stopSpeaking()
    setPool(null)
    setIndex(0)
    setFlipped(false)
    setShake(false)
    setDone(false)
    setResults([])
    setSubmitting(false)
    setFeedback(null)
    setTally(initialSessionTally())
    setToast(null)
    setConfetti(false)
    setFinalMessage(null)
    busyRef.current = false
  }, [])

  useEffect(() => {
    if (resetRef.current === resetKey) return
    resetRef.current = resetKey
    reset()
  }, [resetKey, reset])

  useEffect(() => {
    if (pool === null && incomingWords) setPool(incomingWords)
  }, [incomingWords, pool])

  useEffect(() => {
    return () => {
      clearTimeout(advanceTimer.current)
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    if (!active) stopSpeaking()
  }, [active])

  const restart = useCallback(() => {
    reset()
    onRestart?.()
  }, [reset, onRestart])

  const speak = useCallback(
    (text) => {
      const started = speakWord(text, {
        onError: () =>
          setToast({ variant: 'error', message: "Couldn't play the pronunciation." }),
      })
      if (started && tipOnFirstSpeak && claimTtsTip()) {
        setToast({ variant: 'info', message: 'No sound? Check your device volume.' })
      }
    },
    [tipOnFirstSpeak]
  )

  const answer = useCallback(
    async (correct) => {
      if (busyRef.current || submitting || feedback) return
      const word = words[index]
      if (!word) return
      busyRef.current = true
      setSubmitting(true)

      let gamification = {}
      let box = correct ? 2 : 1
      try {
        const data = await api.post('/progress/review', {
          wordId: word._id,
          correct,
          mode,
        })
        gamification = data.gamification || {}
        box = data.progress?.box || box
      } catch (err) {
        console.error(err)
        busyRef.current = false
        setSubmitting(false)
        setFeedback({ error: true })
        return
      }

      const nextTally = tallyAnswer(tally, { correct, gamification })
      setResults((r) => [...r, { word: word.word, correct }])
      setTally(nextTally)
      invalidateAfterReview(invalidateKey)

      setFlipped(true)
      if (!correct) setShake(true)
      setFeedback({
        correct,
        xpEarned: gamification.xpEarned,
        boxLabel: boxLabel(box),
      })

      if (gamification.newBadges?.length) {
        const names = gamification.newBadges
          .map((b) => `${b.icon} ${b.name}`)
          .join(' · ')
        setToast({ variant: 'gold', message: `Badge earned: ${names}!` })
      }

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
          if (shouldCelebrate(sessionMessageInput(nextTally))) setConfetti(true)
          setFinalMessage(getSessionMessage(sessionMessageInput(nextTally)))
          setDone(true)
        } else {
          setIndex((i) => i + 1)
        }
      }, advanceMs)
    },
    [
      advanceMs,
      feedback,
      index,
      invalidateAfterReview,
      invalidateKey,
      mode,
      submitting,
      tally,
      words,
    ]
  )

  return {
    ready: pool !== null,
    words,
    current,
    index,
    total: words.length,
    flipped,
    setFlipped,
    toggleFlip: () => setFlipped((f) => !f),
    shake,
    feedback,
    setFeedback,
    submitting,
    done,
    results,
    tally,
    toast,
    setToast,
    confetti,
    finalMessage,
    ttsAvailable,
    answer,
    speak,
    restart,
  }
}
