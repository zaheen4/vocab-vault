import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

function Flashcard({ word, flipped, onFlip }) {
  return (
    <button
      onClick={onFlip}
      className="flip-scene block w-full"
      aria-pressed={flipped}
      aria-label={flipped ? `Definition of ${word.word}` : `Word ${word.word}, tap to reveal`}
    >
      <span
        className={`flip-inner relative flex min-h-64 w-full ${flipped ? 'flipped' : ''}`}
      >
        <span className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-primary">{word.word}</h2>
          {word.partOfSpeech && (
            <p className="mt-1 text-sm italic text-slate-400">{word.partOfSpeech}</p>
          )}
          <p className="pt-4 text-xs uppercase tracking-wide text-slate-300">
            Tap to reveal
          </p>
        </span>
        <span className="flip-back flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {word.word}
            {word.partOfSpeech && ` · ${word.partOfSpeech}`}
          </p>
          <p className="mt-2 text-lg font-semibold text-primary">{word.definition}</p>
          {word.example && (
            <p className="mt-1 text-sm italic text-slate-500">“{word.example}”</p>
          )}
          {word.synonyms?.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              Synonyms: {word.synonyms.join(', ')}
            </p>
          )}
        </span>
      </span>
    </button>
  )
}

export default function Practice() {
  const { id } = useParams()
  const { user } = useAuth()
  const [deckTitle, setDeckTitle] = useState('')
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [status, setStatus] = useState('loading')
  const [results, setResults] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.all([api.get(`/decks/${id}`), api.get(`/decks/${id}/practice?limit=10`)])
      .then(([deckData, sessionData]) => {
        if (cancelled) return
        setDeckTitle(deckData.deck.title)
        setWords(sessionData.words)
        setStatus(sessionData.words.length === 0 ? 'empty' : 'ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [id])

  async function answer(correct) {
    const word = words[index]
    setResults((r) => [...r, { word: word.word, correct }])
    try {
      await api.post('/progress/review', { wordId: word._id, correct })
    } catch (err) {
      console.error(err)
    }
    setFlipped(false)
    if (index + 1 >= words.length) {
      setStatus('done')
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-slate-200" />
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        Failed to load the practice session.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <EmptyState
        title="No words due right now"
        message="Everything in this deck is scheduled for review later. Check back soon!"
      />
    )
  }

  if (status === 'done') {
    const correctCount = results.filter((r) => r.correct).length
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8 text-center">
        <h1 className="text-2xl font-bold text-primary">Session complete!</h1>
        <p className="text-slate-500">
          {user?.name?.split(' ')[0]}, you got {correctCount} of {results.length}{' '}
          right.
        </p>
        <ul className="space-y-1 text-sm">
          {results.map((r, i) => (
            <li key={i} className={r.correct ? 'text-emerald-600' : 'text-red-600'}>
              {r.correct ? '✓' : '✗'} {r.word}
            </li>
          ))}
        </ul>
        <Link
          to="/"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-primary hover:brightness-95"
        >
          Back to decks
        </Link>
      </div>
    )
  }

  const current = words[index]

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-400 hover:text-primary">
          ← {deckTitle}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to={`/decks/${id}/quiz`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Quiz mode →
          </Link>
          <span className="text-sm text-slate-400">
            {index + 1} / {words.length}
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      <Flashcard
        word={current}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => answer(false)} fullWidth>
            Didn&apos;t know it
          </Button>
          <Button variant="success" onClick={() => answer(true)} fullWidth>
            Knew it
          </Button>
        </div>
      )}
    </div>
  )
}
