import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

function Flashcard({ word, flipped, onFlip }) {
  return (
    <button
      onClick={onFlip}
      className="flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow"
    >
      {flipped ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {word.word}
            {word.partOfSpeech && ` · ${word.partOfSpeech}`}
          </p>
          <p className="text-lg font-semibold text-primary">{word.definition}</p>
          {word.example && (
            <p className="text-sm italic text-slate-500">“{word.example}”</p>
          )}
          {word.synonyms?.length > 0 && (
            <p className="text-sm text-slate-400">
              Synonyms: {word.synonyms.join(', ')}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-primary">{word.word}</h2>
          {word.partOfSpeech && (
            <p className="text-sm italic text-slate-400">{word.partOfSpeech}</p>
          )}
          <p className="pt-4 text-xs uppercase tracking-wide text-slate-300">
            Tap to reveal
          </p>
        </div>
      )}
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
      <div className="py-16 text-center text-slate-500">
        This deck has no words ready to practice right now — everything is scheduled
        for later. Check back soon!
      </div>
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
        <span className="text-sm text-slate-400">
          {index + 1} / {words.length}
        </span>
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
          <button
            onClick={() => answer(false)}
            className="rounded-md border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Didn&apos;t know it
          </button>
          <button
            onClick={() => answer(true)}
            className="rounded-md border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Knew it
          </button>
        </div>
      )}
    </div>
  )
}
