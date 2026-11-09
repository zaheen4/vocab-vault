import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  isStarred,
  useBookmarks,
  usePracticeSession,
  useToggleBookmark,
} from '../api/queries'
import { useSlideDirection } from '../utils/navDirection'
import { useAuth } from '../context/AuthContext'
import { TTS_UNAVAILABLE_HINT } from '../utils/speak'
import { useStudyKeys } from '../utils/useStudyKeys'
import { useStudySession } from '../hooks/useStudySession'
import Button from '../components/ui/Button'
import { FlameIcon } from '../components/art/icons'
import SpeakerIcon from '../components/ui/SpeakerIcon'
import Toast from '../components/ui/Toast'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import AnswerBar from '../components/AnswerBar'
import Flashcard from '../components/Flashcard'
import LevelUpBanner from '../components/LevelUpBanner'
import SessionResults from '../components/SessionResults'
import SessionStatus from '../components/study/SessionStatus'
import StudyFeedback from '../components/study/StudyFeedback'
import StudyStage from '../components/study/StudyStage'

export default function Practice({ active = true }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const partParam = searchParams.get('part')
  const part = partParam ? Number(partParam) : undefined
  const { user } = useAuth()
  const { data: sessionWords, isLoading, isError } = usePracticeSession(id, 10, part)
  const { data: bookmarks = [] } = useBookmarks()
  const toggleBookmark = useToggleBookmark()
  const [reversed, setReversed] = useState(false)
  const slideCls = useSlideDirection()

  const session = useStudySession({
    words: sessionWords,
    resetKey: `${id}-${part ?? 'all'}`,
    active,
    advanceMs: 850,
    mode: 'practice',
    invalidateKey: id,
    tipOnFirstSpeak: true,
  })

  const {
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
  } = session

  const starred = current ? isStarred(bookmarks, current._id) : false
  const toggleSaved = () => {
    if (!current) return
    toggleBookmark.mutate(
      { wordId: current._id, starred },
      { onError: () => setToast({ variant: 'error', message: "Couldn't save that word." }) }
    )
  }

  useStudyKeys({
    enabled: !done && !!current,
    flipped,
    hasFeedback: !!feedback,
    onFlip: toggleFlip,
    onAgain: () => answer(false),
    onGotIt: () => answer(true),
    onSpeak: () => current && ttsAvailable && speak(current.word),
    onReverse: () => setReversed((r) => !r),
    onBookmark: toggleSaved,
  })

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl border border-line bg-card" />
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-stamp/30 bg-stamp/10 p-4 text-center text-sm text-stamp">
        Failed to load the practice session.{' '}
        <Button variant="secondary" className="ml-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <EmptyState
        art={<EmptyArt variant="review" />}
        title="No words due right now"
        message="Everything here is scheduled for review. Come back tomorrow to keep your streak going and earn more XP!"
      />
    )
  }

  if (done) {
    const firstName = user?.name?.split(' ')[0]
    return (
      <SessionResults
        confetti={confetti}
        message={finalMessage || 'Session complete!'}
        greeting={
          firstName
            ? `${firstName}, you got ${tally.correct} of ${results.length} right.`
            : null
        }
        correct={tally.correct}
        total={results.length}
        levelEvent={tally.levelEvent}
        results={results}
        stats={[
          { label: 'XP earned', value: `+${tally.xp}` },
          {
            label: 'Best combo',
            value: (
              <>
                {tally.bestCombo}
                <FlameIcon size={18} className="text-accent" />
              </>
            ),
          },
          { label: 'New words learned', value: tally.newLearned },
          { label: 'Mastered', value: tally.caughtUp },
        ]}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Practice again
            </Button>
            <Link to="/">
              <Button>Back to decks</Button>
            </Link>
          </>
        }
      />
    )
  }

  const tools = (
    <>
      {ttsAvailable !== null && (
        <span
          title={ttsAvailable ? undefined : TTS_UNAVAILABLE_HINT}
          className={ttsAvailable ? '' : 'cursor-not-allowed'}
        >
          <Button
            variant="secondary"
            className="min-h-11 gap-1 px-2.5 text-xs"
            aria-label={
              ttsAvailable ? `Pronounce ${current.word}` : TTS_UNAVAILABLE_HINT
            }
            disabled={!ttsAvailable || (reversed && !flipped)}
            onClick={() => speak(current.word)}
          >
            <SpeakerIcon />
            <span className="hidden sm:inline">Say it</span>
          </Button>
        </span>
      )}
      <Button
        variant="secondary"
        className={`min-h-11 gap-1 px-2.5 text-xs ${reversed ? 'ring-2 ring-accent' : ''}`}
        aria-label="Reverse card"
        aria-pressed={reversed}
        onClick={() => setReversed((r) => !r)}
      >
        <span aria-hidden="true">⇄</span>
        <span className="hidden sm:inline">Reverse</span>
      </Button>
      <Button
        variant="secondary"
        className="min-h-11 px-2.5 text-xs"
        aria-label={starred ? `Remove ${current.word} from saved` : `Save ${current.word}`}
        aria-pressed={starred}
        onClick={toggleSaved}
      >
        {starred ? '★' : '☆'}
      </Button>
    </>
  )

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${slideCls}`}>
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
        notice={tally.levelEvent ? <LevelUpBanner level={tally.levelEvent.newLevel} /> : null}
      >
        <Flashcard
          word={current}
          flipped={flipped}
          onFlip={toggleFlip}
          shake={shake}
          reversed={reversed}
        />
      </StudyStage>

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
