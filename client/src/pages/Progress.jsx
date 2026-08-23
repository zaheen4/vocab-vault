import { useEffect, useState } from 'react'
import { api } from '../api/client'

const CARDS = [
  { key: 'mastered', label: 'Mastered', class: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
  { key: 'learning', label: 'Learning', class: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
  { key: 'new', label: 'Not started', class: 'border-slate-200 bg-slate-50', text: 'text-slate-500' },
]

export default function Progress() {
  const [summary, setSummary] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    api
      .get('/progress/summary')
      .then((data) => {
        if (!cancelled) {
          setSummary(data.summary)
          setStatus('ready')
        }
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        Failed to load progress.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  const total = Object.values(summary).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Your progress</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total === 0
            ? 'Practice a deck to start tracking your progress.'
            : `${total} word${total === 1 ? '' : 's'} in your learning pipeline.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS.map(({ key, label, class: cardClass, text }) => (
          <div key={key} className={`rounded-lg border p-5 ${cardClass}`}>
            <p className={`text-3xl font-bold ${text}`}>{summary[key] || 0}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
