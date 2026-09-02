import { useEffect, useState } from 'react'
import { api } from '../api/client'

const CARDS = [
  { key: 'mastered', label: 'Mastered', class: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
  { key: 'learning', label: 'Learning', class: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
  { key: 'new', label: 'Not started', class: 'border-slate-200 bg-slate-50', text: 'text-slate-500' },
]

export default function Progress() {
  const [summary, setSummary] = useState(null)
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    Promise.all([api.get('/progress/summary'), api.get('/gamification/me')])
      .then(([summaryData, statsData]) => {
        if (cancelled) return
        setSummary(summaryData.summary)
        setStats(statsData.gamification)
        setStatus('ready')
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

      {stats && (
        <div className="rounded-xl border border-accent bg-gold/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">⭐ {stats.level}</p>
                <p className="text-xs text-slate-500">Level</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">🔥 {stats.dailyStreak}</p>
                <p className="text-xs text-slate-500">Day streak</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">+{stats.xp} XP</p>
                <p className="text-xs text-slate-500">Total xp</p>
              </div>
            </div>
            <div className="min-w-56 flex-1">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>
                  Level {stats.level}
                </span>
                <span>Level {stats.level + 1}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${(stats.progressToNext || 0) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-slate-400">
                {Math.round((stats.progressToNext || 0) * 100)}% to next level
              </p>
            </div>
          </div>
        </div>
      )}

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
