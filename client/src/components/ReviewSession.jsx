import { TTS_UNAVAILABLE_HINT } from '../utils/speak'
import { AnimatePresence } from '../lib/motion'
import { useStudyKeys } from '../utils/useStudyKeys'
import { useStudySession } from '../hooks/useStudySession'
import { useSlideDirection } from '../utils/navDirection'
import AnswerBar from './AnswerBar'
import Button from './ui/Button'
import SpeakerIcon from './ui/SpeakerIcon'
import Toast from './ui/Toast'
import EmptyState from './ui/EmptyState'
import Flashcard from './Flashcard'
import SessionResults from './SessionResults'
import SessionStatus from './study/SessionStatus'
import StudyFeedback from './study/StudyFeedback'
import StudyFrame from './study/StudyFrame'
import StudyHeader from './study/StudyHeader'
import StudyStage from './study/StudyStage'

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
  const slideCls = useSlideDirection()

  const session = useStudySession({
    words: incomingWords,
    active: true,
    advanceMs: 900,
    mode: 'practice',
    invalidateKey: undefined,
    onRestart,
  })

  const {
    ready,
    words,
    current,
    index,
    total,
    flipped,
    toggleFlip,
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
  } = session

  useStudyKeys({
    enabled: !done && !!current,
    flipped,
    hasFeedback: !!feedback,
    onFlip: toggleFlip,
    onAgain: () => answer(false),
    onGotIt: () => answer(true),
    onSpeak: () => current && speak(current.word),
  })

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

  if (isLoading || !ready) {
    return <div className="h-64 animate-pulse rounded-xl border border-line bg-card" />
  }

  if (words.length === 0) {
    return (
      <StudyFrame className="animate-page">
        <StudyHeader title={title} meta={subtitle} backTo={backTo} backLabel={backLabel} />
        <EmptyState
          art={emptyArt}
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
        />
      </StudyFrame>
    )
  }

  if (done) {
    return (
      <SessionResults
        confetti={confetti}
        message={finalMessage || resultsTitle}
        subtitle={`You got ${tally.correct} of ${results.length} right · +${tally.xp} XP`}
        correct={tally.correct}
        total={results.length}
        levelEvent={tally.levelEvent}
        results={results}
        stats={[
          { label: 'XP earned', value: `+${tally.xp}` },
          { label: 'Best combo', value: tally.bestCombo },
          { label: 'New words learned', value: tally.newLearned },
          { label: 'Mastered', value: tally.caughtUp },
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

  const tools =
    ttsAvailable !== null ? (
      <span
        title={ttsAvailable ? undefined : TTS_UNAVAILABLE_HINT}
        className={ttsAvailable ? '' : 'cursor-not-allowed'}
      >
        <Button
          variant="secondary"
          className="min-h-11 gap-1 px-2.5 text-xs"
          aria-label={ttsAvailable ? `Pronounce ${current.word}` : TTS_UNAVAILABLE_HINT}
          disabled={!ttsAvailable}
          onClick={() => speak(current.word)}
        >
          <SpeakerIcon />
          <span className="hidden sm:inline">Say it</span>
        </Button>
      </span>
    ) : null

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${slideCls}`}>
      <StudyFrame>
        <StudyHeader title={title} meta={subtitle} backTo={backTo} backLabel={backLabel} />

        <StudyStage
          status={
            <SessionStatus
              index={index}
              total={total}
              score={tally.correct}
              combo={tally.combo}
              xp={tally.xp}
              actions={tools}
            />
          }
          footer={
            feedback ? (
              <StudyFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
            ) : flipped ? (
              <AnswerBar
                onAgain={() => answer(false)}
                onGotIt={() => answer(true)}
                disabled={submitting}
              />
            ) : null
          }
        >
          <Flashcard
            word={current}
            flipped={flipped}
            onFlip={toggleFlip}
            shake={shake}
            reversed={false}
          />
        </StudyStage>
      </StudyFrame>

      <AnimatePresence>
        {toast && (
          <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
