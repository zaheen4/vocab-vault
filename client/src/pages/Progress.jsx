import { useGamification, useProgressSummary, useSetGoalTarget } from '../api/queries'

const CARDS = [
  { key: 'mastered', label: 'Mastered', class: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
  { key: 'learning', label: 'Learning', class: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
  { key: 'new', label: 'Not started', class: 'border-slate-200 bg-slate-50', text: 'text-slate-500' },
]

const GOAL_TARGETS = [5, 10, 15, 20, 25, 30, 40, 50]

// Display catalog mirrors server/src/utils/gamify.js BADGES.
const BADGES = [
  { id: 'first-word', name: 'First Word', icon: '🌱', description: 'Review your first word' },
  { id: 'century', name: 'Century', icon: '💯', description: 'Review 100 words' },
  { id: 'week-warrior', name: 'Week Warrior', icon: '🔥', description: 'Reach a 7-day streak' },
  { id: 'level-5', name: 'Level 5', icon: '⭐', description: 'Reach level 5' },
  { id: 'flawless', name: 'Flawless', icon: '💎', description: '10 correct in a row' },
]

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 7-day activity strip. Decorative: guards on missing activity, never blocks.
function ActivityStrip({ activity }) {
  const byDate = new Map((activity || []).map((a) => [a.date, a.reviews || 0]))
  const today = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    days.push({ key: dayKey(d), letter: DAY_LETTERS[d.getDay()], isToday: i === 0, reviews: byDate.get(dayKey(d)) || 0 })
  }
  const max = Math.max(1, ...days.map((d) => d.reviews))
  const total = days.reduce((a, d) => a + d.reviews, 0)
  const tone = (n) =>
    n === 0
      ? 'bg-slate-100'
      : n / max < 0.34
        ? 'bg-accent/30'
        : n / max < 0.67
          ? 'bg-accent/60'
          : 'bg-accent'

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-bold text-primary">This week</h2>
        <p className="text-xs text-slate-500">
          {total} review{total === 1 ? '' : 's'}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <span
              title={`${d.key}: ${d.reviews} review${d.reviews === 1 ? '' : 's'}`}
              className={`flex h-10 w-full items-center justify-center rounded-md text-xs font-bold text-primary ${tone(d.reviews)} ${d.isToday ? 'ring-2 ring-primary' : ''}`}
            >
              {d.reviews > 0 ? d.reviews : ''}
            </span>
            <span className="text-xs text-slate-400">{d.letter}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Progress() {
  const { data: summary, isLoading, isError } = useProgressSummary()
  // Decorative gamification banner: never block the page on failure
  const { data: stats } = useGamification()
  const setGoal = useSetGoalTarget()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    )
  }

  if (isError) {
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
    <div className="animate-page space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Your progress</h1>
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

      {stats && <ActivityStrip activity={stats.activity || []} />}

      {stats && (
        <div className="rounded-xl border border-primary/10 bg-white p-5">
          <div className="flex flex-wrap items-center gap-6">
            {/* Goal ring */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-slate-200)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-accent)"
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${Math.min(1, (stats.reviewsToday || 0) / (stats.dailyGoalTarget || 10)) * 97.4} 97.4`}
                />
              </svg>
              <span className="absolute text-sm font-bold text-primary">
                {stats.reviewsToday || 0}
              </span>
            </div>
            <div className="min-w-56 flex-1">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-primary">
                  Daily goal: {stats.reviewsToday || 0} / {stats.dailyGoalTarget || 10}
                </p>
                {stats.streakFreezes > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    🧊 × {stats.streakFreezes}
                  </span>
                )}
                {stats.goalsMet > 0 && (
                  <span className="text-xs text-slate-400">
                    {stats.goalsMet} goal{stats.goalsMet > 1 ? 's' : ''} met
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GOAL_TARGETS.map((t) => (
                  <button
                    key={t}
                    disabled={setGoal.isPending}
                    onClick={() => setGoal.mutate(t)}
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                      (stats.dailyGoalTarget || 10) === t
                        ? 'border-accent bg-accent text-primary'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
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

      {stats && (
        <div className="rounded-xl border border-primary/10 bg-white p-5">
          <h2 className="font-display text-base font-bold text-primary">Badges</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {(stats.badges || []).length} of {BADGES.length} earned — keep practicing to unlock the rest.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {BADGES.map((badge) => {
              const earned = (stats.badges || []).find((b) => b.id === badge.id)
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  className={`rounded-lg border p-3 text-center ${
                    earned
                      ? 'border-accent bg-gold/40'
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <p className={`text-2xl ${earned ? '' : 'grayscale'}`}>{badge.icon}</p>
                  <p className="mt-1 text-xs font-bold text-primary">{badge.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{badge.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
