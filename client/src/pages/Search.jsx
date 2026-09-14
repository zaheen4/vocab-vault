import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import SpeakerIcon from '../components/ui/SpeakerIcon'
import { isTtsSupported, speakWord, stopSpeaking } from '../utils/speak'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none'

export default function Search() {
  const [query, setQuery] = useState('')
  const [words, setWords] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('idle')
  const timerRef = useRef(null)

  // Never leave speech playing after navigating away from results.
  useEffect(() => () => stopSpeaking(), [])

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
      <input
        type="search"
        placeholder="Search words…"
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
              <h3 className="font-display font-semibold text-primary">{w.word}</h3>
              {isTtsSupported() && (
                <Button
                  variant="secondary"
                  className="shrink-0 self-center"
                  aria-label={`Pronounce ${w.word}`}
                  onClick={() => speakWord(w.word)}
                >
                  <SpeakerIcon />
                </Button>
              )}
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
          </li>
        ))}
      </ul>

      {status === 'ready' && words.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          No words match “{query}”.
        </p>
      )}
    </div>
  )
}
