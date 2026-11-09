import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from '../lib/motion'
import { api } from '../api/client'
import { isStarred, useBookmarks, useToggleBookmark } from '../api/queries'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Notice from '../components/ui/Notice'
import EmptyArt from '../components/art/EmptyArt'
import SpeakerIcon from '../components/ui/SpeakerIcon'
import Toast from '../components/ui/Toast'
import WordHistory from '../components/WordHistory'
import {
  claimTtsTip,
  speakWord,
  stopSpeaking,
  TTS_UNAVAILABLE_HINT,
  useTtsAvailable,
} from '../utils/speak'

export default function Search() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [words, setWords] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('idle')
  const [toast, setToast] = useState(null)
  const [openId, setOpenId] = useState(null)
  const { data: bookmarks = [] } = useBookmarks()
  const toggleBookmark = useToggleBookmark()
  const ttsAvailable = useTtsAvailable()
  const timerRef = useRef(null)

  useEffect(() => () => stopSpeaking(), [])

  function speak(text) {
    const started = speakWord(text, {
      onError: () =>
        setToast({ variant: 'error', message: "Couldn't play the pronunciation." }),
    })
    if (started && claimTtsTip()) {
      setToast({ variant: 'info', message: 'No sound? Check your device volume.' })
    }
  }

  useEffect(() => {
    clearTimeout(timerRef.current)

    if (!query.trim()) {
      setWords([])
      setTotal(0)
      setStatus('idle')
      return undefined
    }

    setStatus('loading')
    timerRef.current = setTimeout(() => {
      api
        .get(`/words?q=${encodeURIComponent(query.trim())}&limit=50`)
        .then((data) => {
          setWords(data.words)
          setTotal(data.total)
          setStatus('ready')
        })
        .catch(() => setStatus('error'))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  return (
    <div className="animate-page space-y-4">
      <Input
        id="word-search"
        type="search"
        placeholder="Search words…"
        aria-label="Search words"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {status === 'idle' && (
        <div className="space-y-3 py-8 text-center">
          <div className="flex justify-center" aria-hidden="true">
            <EmptyArt variant="search" />
          </div>
          <p className="text-sm font-semibold text-ink">
            Search 1,100+ GRE words
          </p>
          <p className="mx-auto max-w-sm text-sm text-ink-muted">
            Matches anywhere in the word — star what you want to keep, and add
            your own words when the dictionary falls short.
          </p>
        </div>
      )}

      {status === 'loading' && (
        <p className="text-sm text-ink-muted">Searching…</p>
      )}
      {status === 'error' && (
        <Notice tone="error">Search failed. Try again.</Notice>
      )}
      {status === 'ready' && (
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {total} result{total === 1 ? '' : 's'}
        </p>
      )}

      <ul className="space-y-2">
        {words.map((w, i) => (
          <li
            key={w._id}
            className="animate-fade-up rounded-xl border border-line bg-card p-4 shadow-paper"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <button
                type="button"
                onClick={() => setOpenId((o) => (o === w._id ? null : w._id))}
                aria-expanded={openId === w._id}
                className="flex min-h-9 min-w-0 flex-1 items-baseline gap-1.5 text-left"
              >
                <span className="font-display font-semibold break-words text-ink">{w.word}</span>
                <span className="shrink-0 text-xs font-bold text-ink-muted">
                  {openId === w._id ? '▾' : '▸'}
                </span>
              </button>
              <span className="flex shrink-0 items-center gap-1.5 self-center">
                <Button
                  variant="secondary"
                  aria-label={isStarred(bookmarks, w._id) ? `Remove ${w.word} from saved` : `Save ${w.word}`}
                  aria-pressed={isStarred(bookmarks, w._id)}
                  onClick={() =>
                    toggleBookmark.mutate(
                      { wordId: w._id, starred: isStarred(bookmarks, w._id) },
                      {
                        onError: () =>
                          setToast({ variant: 'error', message: "Couldn't save that word." }),
                      }
                    )
                  }
                >
                  {isStarred(bookmarks, w._id) ? '★' : '☆'}
                </Button>
                {ttsAvailable !== null && (
                  <span
                    title={ttsAvailable ? undefined : TTS_UNAVAILABLE_HINT}
                    className={ttsAvailable ? '' : 'cursor-not-allowed'}
                  >
                    <Button
                      variant="secondary"
                      className="shrink-0 self-center"
                      aria-label={
                        ttsAvailable ? `Pronounce ${w.word}` : TTS_UNAVAILABLE_HINT
                      }
                      disabled={!ttsAvailable}
                      onClick={() => speak(w.word)}
                    >
                      <SpeakerIcon />
                    </Button>
                  </span>
                )}
              </span>
              {w.partOfSpeech && (
                <span className="text-xs text-ink-muted italic">{w.partOfSpeech}</span>
              )}
              {w.group != null && (
                <span className="ml-auto shrink-0 rounded-full bg-raised px-2 py-0.5 text-xs font-medium text-ink-muted">
                  Group {w.group}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink">{w.definition}</p>
            {w.example && (
              <p className="mt-1 text-sm text-ink-muted italic">“{w.example}”</p>
            )}
            {openId === w._id && (
              <div className="mt-2 border-t border-line pt-2">
                <p className="text-xs font-bold text-ink-muted">History</p>
                <div className="mt-1">
                  <WordHistory wordId={w._id} active />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {status === 'ready' && words.length === 0 && (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-ink-muted">No words match “{query}”.</p>
          <Link
            to={`/words/new?q=${encodeURIComponent(query.trim())}`}
            className="inline-flex min-h-11 items-center rounded-md border border-accent bg-gold px-4 py-2 font-display text-sm font-bold text-primary transition-colors hover:bg-gold/80 dark:bg-accent/15 dark:text-accent-ink dark:hover:bg-accent/25"
          >
            + Add “{query.trim()}” as your own word
          </Link>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <Toast
            variant={toast.variant}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
