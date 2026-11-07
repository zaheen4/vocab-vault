import { Link } from 'react-router-dom'
import { useGamification, useProgressSummary, useSetGoalTarget, useWeakWords } from '../api/queries'
import { useCountUp } from '../utils/countUp'
import { useReducedMotion, m } from '../lib/motion'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import ProgressRing from '../components/ProgressRing'
import PipelineBar from '../components/PipelineBar'
import WeekStrip from '../components/WeekStrip'
import BadgeStamp from '../components/BadgeStamp'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
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
  { id: 'level-5', name: 'Level 5', Icon: StarIcon, description: 'Reach level 5', progress: (s) => `${Math.min(s.level || 1, 5)}/5 levels` },
  { id: 'flawless', name: 'Flawless', Icon: GemIcon, description: '10 correct in a row', progress: null },
]

// A ledger line, not a stat tile: label at the left margin, figure right-
// aligned against the same edge, dotted leader between. Three figures in three
// floating columns read as a template; three ledger lines read as a record.
function LedgerRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-1 items-baseline gap-2">
        <span aria-hidden="true" className="min-w-3 flex-1 border-b border-dotted border-line" />
        <span className="font-display text-sm font-bold text-ink tabular-nums">{value}</span>
      </dd>
    </div>
  )
}

// The goal ring celebrates with a halo, not a box-shadow: the halo is an
// absolutely positioned circle sharing the ring's box, so it is concentric by
// construction. The old glow wrapped an inline child, which left a baseline
// gap — 76×83 — and `rounded-full` drew an ellipse 3.5px below the ring.
function GoalRing({ done, target, met }) {
  const reduceMotion = useReducedMotion()
  return (
    <span className="relative flex shrink-0">
      <ProgressRing pct={done / target} size={76} strokeWidth={3}>
        <span className="font-display text-lg font-bold text-ink tabular-nums">{done}</span>
      </ProgressRing>
      {met && (
        <m.span
          aria-hidden="true"
          initial={false}
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-accent/60"
          animate={reduceMotion ? { opacity: 0.4 } : { scale: [1, 1.22], opacity: [0.55, 0] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.9, repeat: Infinity, ease: 'easeOut' }
          }
        />
      )}
    </span>
  )
}

// Level passport: the page's identity block, laid out as the inside cover of a
// record — ring, level, then three ledger lines. The ring is the navbar chip's
// geometry two sizes up, so the number in the navbar and the number here are
// recognisably the same instrument.
function Passport({ stats, level, streak, xp }) {
  const pct = stats.progressToNext || 0
  return (
    <Sheet tab="Passport" className="flex h-full flex-col bg-manila">
      <div className="flex items-center gap-5">
        <ProgressRing pct={pct} size={84} strokeWidth={3.5}>
          <span className="font-display text-xl font-bold text-ink tabular-nums">{level}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl leading-tight font-bold text-ink">
            Level {stats.level}
          </p>
          <p className="text-xs font-semibold text-ink-muted tabular-nums">
            {Math.round(pct * 100)}% to level {stats.level + 1}
          </p>
          <dl className="mt-3 space-y-1.5">
            <LedgerRow label="Total XP" value={xp.toLocaleString('en-US')} />
            <LedgerRow label="Day streak" value={streak} />
            <LedgerRow
              label="Freeze"
              value={stats.streakFreezes > 0 ? `×${stats.streakFreezes}` : '—'}
            />
          </dl>
        </div>
      </div>
      <p className="mt-auto border-t border-line pt-3 text-xs text-ink-muted">
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
      className="flex h-full flex-col"
      meta={
        <span className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase tabular-nums">
          {done} / {target}
        </span>
      }
    >
      {/* Ring and promise on the left, the picker as a compact 4x2 block on
          the right. The old full-width 8-across strip left a dead band across
          the middle of a wide card and made the card taller than the passport
          beside it. */}
      <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-4">
        <GoalRing done={done} target={target} met={met} />
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
          className="grid w-full grid-cols-4 gap-1.5 sm:w-48 sm:shrink-0"
          role="group"
          aria-label="Daily goal target"
        >
          {GOAL_TARGETS.map((value) => (
            <Chip
              key={value}
              pressed={target === value}
              disabled={setGoal.isPending}
              aria-label={`Set daily goal to ${value} reviews`}
              onClick={() => setGoal.mutate(value)}
              className="justify-center rounded-md px-2 font-mono tabular-nums"
            >
              {value}
            </Chip>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

// The only loud surface on the page: everything else is quiet paper, so the
// one stamped card carries the urgency — count, reason, one action.
function MistakeBank({ count }) {
  return (
    <Sheet tab="Mistake bank" className="flex h-full flex-col border-stamp/30 bg-stamp/5">
      {/* The count and its reason centre in the space above the pinned action:
          the card matches the badge shelf's height, so top-aligning a three-
          line block left a hole in the middle of the card. */}
      <div className="flex flex-1 flex-col justify-center">
        <p className="font-display text-3xl font-bold text-stamp tabular-nums">
          {count}
          <span className="ml-2 text-base font-bold text-ink">word{count === 1 ? '' : 's'}</span>
        </p>
        <p className="mt-1 text-xs text-ink-muted">Stuck in box 1 — clear them before they harden.</p>
      </div>
      <Link to="/practice/weak" className="mt-4 block">
        <Button variant="stamp" chunky fullWidth className="gap-1.5">
          Cram weak words <span aria-hidden="true">→</span>
        </Button>
      </Link>
    </Sheet>
  )
}

// Badges stay a shelf of stamps, but the footer names the next unlock with its
// real measure instead of telling the reader to keep practising.
function BadgeShelf({ stats }) {
  const earned = stats.badges || []
  const earnedIds = new Set(earned.map((badge) => badge.id))
  const next = BADGES.find((badge) => !earnedIds.has(badge.id))
  const nextText = next ? (next.progress ? next.progress(stats) : next.description) : ''

  return (
    <Sheet tab="Badges" className="flex h-full flex-col">
      {/* No header row: with no title, the only header content was the count
          floating on the right of an empty rule. The footer carries it
          instead, next to the name of the next unlock. */}
      {/* Flex, not a grid: five stamps never divide evenly into two phone
          columns, and the odd one out used to sit alone against the left edge.
          `justify-center` centres it; from `sm` every stamp takes an equal
          share of the row. The negative gutters keep the outer edges flush with
          the card while every item is exactly half the row. */}
      <div className="-mx-1 -mb-2 flex flex-wrap justify-center">
        {BADGES.map((badge) => {
          const progressText = badge.progress ? badge.progress(stats) : badge.description
          return (
            <div key={badge.id} className="w-1/2 px-1 pb-2 sm:w-auto sm:flex-1">
              <BadgeStamp
                badge={badge}
                earned={earnedIds.has(badge.id)}
                progressText={progressText}
              />
            </div>
          )
        })}
      </div>
      <p className="mt-auto pt-3 text-xs text-ink-muted">
        {earned.length} of {BADGES.length} earned.{' '}
        {next ? (
          <>
            Next up: <span className="font-semibold text-ink">{next.name}</span> — {nextText}.
          </>
        ) : (
          'Every badge collected — the catalog is yours.'
        )}
      </p>
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
      <div aria-busy="true" aria-label="Loading progress">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-48 animate-pulse rounded-xl border border-line bg-raised lg:col-span-4" />
          <div className="h-48 animate-pulse rounded-xl border border-line bg-raised lg:col-span-8" />
          <div className="h-40 animate-pulse rounded-xl border border-line bg-raised lg:col-span-4" />
          <div className="h-40 animate-pulse rounded-xl border border-line bg-raised lg:col-span-8" />
          <div className="h-44 animate-pulse rounded-xl border border-line bg-raised lg:col-span-4" />
          <div className="h-44 animate-pulse rounded-xl border border-line bg-raised lg:col-span-8" />
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
  const weakCount = weakData?.totalWeak || 0

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        eyebrow="Statistics"
        title="Your progress"
        sub={
          total === 0
            ? 'Practice a deck to start tracking your progress.'
            : `${total} word${total === 1 ? '' : 's'} in your learning pipeline.`
        }
        action={
          <Link to="/history">
            <Button variant="secondary" className="gap-1.5">
              Activity history <span aria-hidden="true">→</span>
            </Button>
          </Link>
        }
      />

      {/* Three uneven rows, four columns against eight: identity beside
          today's commitment, the week beside the inventory bar, the mistake
          bank beside the badge shelf. A stack of six equal cards reads as a
          template; a spread reads as a record. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {stats && (
          <div className="lg:col-span-4">
            <Passport stats={stats} level={shownLevel} streak={shownStreak} xp={shownXp} />
          </div>
        )}
        {stats && (
          <div className="lg:col-span-8">
            <GoalSection stats={stats} setGoal={setGoal} />
          </div>
        )}

        <div className="lg:col-span-4">
          <WeekStrip activity={stats?.activity} />
        </div>
        <div className="lg:col-span-8">
          <PipelineBar summary={summary} />
        </div>

        {weakCount > 0 && (
          <div className="lg:col-span-4">
            <MistakeBank count={weakCount} />
          </div>
        )}
        {stats && (
          <div className={weakCount > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <BadgeShelf stats={stats} />
          </div>
        )}
      </div>
    </div>
  )
}
