import { Link } from 'react-router-dom'
import { useGamification, useProgressSummary, useSetGoalTarget, useWeakWords } from '../api/queries'
import { useCountUp } from '../utils/countUp'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import ProgressRing from '../components/ProgressRing'
import PipelineBar from '../components/PipelineBar'
import WeekStrip from '../components/WeekStrip'
import BadgeStamp from '../components/BadgeStamp'
import { FlameIcon, GemIcon, HundredIcon, SproutIcon, StarIcon } from '../components/art/icons'

const GOAL_TARGETS = [5, 10, 15, 20, 25, 30, 40, 50]

// Display catalog mirrors server/src/utils/gamify.js BADGES.
// progress() derives the locked-state X/Y hint from the gamification payload
// (null when the payload carries no measure — flawless needs perfectRun,
// which the endpoint doesn't return).
const BADGES = [
  { id: 'first-word', name: 'First Word', Icon: SproutIcon, description: 'Review your first word', progress: (s) => `${Math.min(s.totalReviewed || 0, 1)}/1 review` },
  { id: 'century', name: 'Century', Icon: HundredIcon, description: 'Review 100 words', progress: (s) => `${Math.min(s.totalReviewed || 0, 100)}/100 reviews` },
  { id: 'week-warrior', name: 'Week Warrior', Icon: FlameIcon, description: 'Reach a 7-day streak', progress: (s) => `${Math.min(s.dailyStreak || 0, 7)}/7 day streak` },
  { id: 'level-5', name: 'Level 5', Icon: StarIcon, description: 'Reach level 5', progress: (s) => `level ${Math.min(s.level || 1, 5)}/5` },
  { id: 'flawless', name: 'Flawless', Icon: GemIcon, description: '10 correct in a row', progress: null },
]

const HISTORY_LINK =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line bg-card px-4 font-display text-sm font-bold text-ink transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const STAMP_LINK =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-b-4 border-stamp/60 bg-stamp px-4 font-display text-sm font-bold text-white transition-all dark:text-night-950 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-1 active:border-b-0'

function Stat({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="font-display text-2xl font-bold text-ink tabular-nums">{value}</dd>
    </div>
  )
}

// Level passport: who you are in the catalog, at a glance. The ring is the
// same geometry as the navbar chip, one size up.
function Passport({ stats, level, streak, xp }) {
  const pct = stats.progressToNext || 0
  return (
    <Sheet tab="Passport" className="bg-gold/35 dark:bg-night-900">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
        <div className="flex items-center gap-4">
          <ProgressRing pct={pct} size={76} strokeWidth={3}>
            <span className="font-display text-xl font-bold text-ink tabular-nums">{level}</span>
          </ProgressRing>
          <div>
            <p className="font-display text-2xl font-bold text-ink">Level {stats.level}</p>
            <p className="text-xs font-semibold text-ink-muted tabular-nums">
              {Math.round(pct * 100)}% to level {stats.level + 1}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <Stat label="Total XP" value={xp.toLocaleString('en-US')} />
          <Stat label="Day streak" value={streak} />
          <div>
            <dt className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
              Freeze
            </dt>
            <dd className="font-display text-2xl font-bold text-ink tabular-nums">
              {stats.streakFreezes > 0 ? `×${stats.streakFreezes}` : '—'}
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
        {stats.goalsMet > 0
          ? `${stats.goalsMet} daily goal${stats.goalsMet === 1 ? '' : 's'} met so far.`
          : 'Meet your daily goal to earn a streak freeze.'}
      </p>
    </Sheet>
  )
}

function GoalSection({ stats, setGoal }) {
  const target = stats.dailyGoalTarget || 10
  const done = stats.reviewsToday || 0
  const met = done >= target
  return (
    <Sheet
      tab="Daily goal"
      title="Today"
      meta={
        <span className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase tabular-nums">
          {done} / {target}
        </span>
      }
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className={met ? 'animate-glow rounded-full' : ''}>
          <ProgressRing pct={done / target} size={76} strokeWidth={3}>
            <span className="font-display text-lg font-bold text-ink tabular-nums">{done}</span>
          </ProgressRing>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {met ? 'Daily goal met — nice work!' : `${target - done} to go today`}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {stats.streakFreezes > 0
              ? `${stats.streakFreezes} freeze${stats.streakFreezes === 1 ? '' : 's'} in reserve — one survives a missed day.`
              : 'A freeze covers one missed practice day.'}
          </p>
        </div>
        <div
          className="grid w-full grid-cols-4 gap-1.5 sm:grid-cols-8"
          role="group"
          aria-label="Daily goal target"
        >
          {GOAL_TARGETS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={setGoal.isPending}
              aria-pressed={target === value}
              onClick={() => setGoal.mutate(value)}
              className={`flex min-h-9 items-center justify-center rounded-md border px-2 font-mono text-2xs font-bold tabular-nums transition-colors disabled:opacity-50 ${
                target === value
                  ? 'border-accent bg-accent/20 text-accent-ink'
                  : 'border-line bg-card text-ink-muted hover:text-ink'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

export default function Progress() {
  const { data: summary, isLoading, isError } = useProgressSummary()
  // Decorative gamification surfaces: never block the page on failure
  const { data: stats } = useGamification()
  const { data: weakData } = useWeakWords(1)
  const setGoal = useSetGoalTarget()
  const shownLevel = useCountUp(stats?.level || 0)
  const shownStreak = useCountUp(stats?.dailyStreak || 0)
  const shownXp = useCountUp(stats?.xp || 0)

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading progress">
        <div className="h-24 animate-pulse rounded-xl border border-line bg-raised" />
        <div className="h-32 animate-pulse rounded-xl border border-line bg-raised" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl border border-line bg-raised" />
          <div className="h-40 animate-pulse rounded-xl border border-line bg-raised" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-stamp/30 bg-stamp/5 p-4 text-center text-sm text-stamp">
        Failed to load progress.{' '}
        <button type="button" className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  const total = Object.values(summary).reduce((a, b) => a + b, 0)

  return (
    <div className="animate-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Statistics"
          title="Your progress"
          sub={
            total === 0
              ? 'Practice a deck to start tracking your progress.'
              : `${total} word${total === 1 ? '' : 's'} in your learning pipeline.`
          }
        />
        <Link to="/history" className={HISTORY_LINK}>
          Activity history <span aria-hidden="true">→</span>
        </Link>
      </div>

      {stats && (
        <Passport stats={stats} level={shownLevel} streak={shownStreak} xp={shownXp} />
      )}

      <PipelineBar summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeekStrip activity={stats?.activity} />
        {stats && <GoalSection stats={stats} setGoal={setGoal} />}
      </div>

      {(weakData?.totalWeak || 0) > 0 && (
        <Sheet tab="Mistake bank" className="border-stamp/30 bg-stamp/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-3xl font-bold text-stamp tabular-nums">
                {weakData.totalWeak}
                <span className="ml-2 text-base font-bold text-ink">
                  word{weakData.totalWeak === 1 ? '' : 's'}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Stuck in box 1 — clear them before they harden.
              </p>
            </div>
            <Link to="/practice/weak" className={STAMP_LINK}>
              Cram weak words <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Sheet>
      )}

      {stats && (
        <Sheet
          tab="Badges"
          title="Badges"
          meta={
            <span className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase tabular-nums">
              {(stats.badges || []).length} of {BADGES.length} earned
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {BADGES.map((badge) => {
              const earned = (stats.badges || []).find((b) => b.id === badge.id)
              const progressText = badge.progress ? badge.progress(stats) : badge.description
              return (
                <BadgeStamp
                  key={badge.id}
                  badge={badge}
                  earned={Boolean(earned)}
                  progressText={progressText}
                />
              )
            })}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            {(stats.badges || []).length < BADGES.length
              ? 'Keep practicing to unlock the rest.'
              : 'Every badge earned — the catalog is yours.'}
          </p>
        </Sheet>
      )}
    </div>
  )
}
