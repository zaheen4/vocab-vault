import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { isStarred, useBookmarks, useToggleBookmark } from '../api/queries'
import Button from '../components/ui/Button'
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

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none'

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

  // Never leave speech playing after navigating away from results.
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
      <label className="sr-only" htmlFor="word-search">Search words</label>
      <input
        id="word-search"
        type="search"
        placeholder="Search words…"
        aria-label="Search words"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClass}
        autoFocus
      />

      {status === 'loading' && (
        <p className="text-sm text-slate-500">Searching…</p>
      )}
      {status === 'error' && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          Search failed. Try again.
        </p>
      )}
      {status === 'ready' && (
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {total} result{total === 1 ? '' : 's'}
        </p>
      )}

      <ul className="space-y-2">
        {words.map((w) => (
          <li
            key={w._id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-3">
              <button
                type="button"
                onClick={() => setOpenId((o) => (o === w._id ? null : w._id))}
                aria-expanded={openId === w._id}
                className="flex min-h-9 flex-1 items-baseline gap-1.5 text-left"
              >
                <span className="font-display font-semibold text-primary">{w.word}</span>
                <span className="shrink-0 text-xs font-bold text-slate-300">
                  {openId === w._id ? '▾' : '▸'}
                </span>
              </button>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 self-center">
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
                <span className="text-xs text-slate-400 italic">{w.partOfSpeech}</span>
              )}
              {w.group != null && (
                <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Group {w.group}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">{w.definition}</p>
            {w.example && (
              <p className="mt-1 text-sm text-slate-400 italic">“{w.example}”</p>
            )}
            {openId === w._id && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <p className="text-xs font-bold text-slate-500">History</p>
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
          <p className="text-sm text-slate-400">No words match “{query}”.</p>
          <Link
            to={`/words/new?q=${encodeURIComponent(query.trim())}`}
            className="inline-block rounded-md border border-accent bg-gold/40 px-4 py-2 font-display text-sm font-bold text-primary transition-colors hover:bg-gold"
          >
            + Add “{query.trim()}” as your own word
          </Link>
        </div>
      )}

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
