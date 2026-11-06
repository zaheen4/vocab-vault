import { Link } from 'react-router-dom'
import { useCountUp } from '../utils/countUp'
import { FlameIcon } from './art/icons'

// Shared session HUD: back link, position, live score/combo/XP and one strong
// progress bar. Practice/Quiz/Typing/Review share it so a session reads the
// same everywhere. SavedPractice keeps no bar on purpose (short saved queue).
export default function SessionHud({
  backTo,
  backLabel,
  index,
  total,
  score,
  combo = 0,
  sessionXp = null,
  actions = null,
}) {
  const shownXp = useCountUp(sessionXp ?? 0)
  const pct = total === 0 ? 0 : Math.round((index / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Link
          to={backTo}
          className="inline-flex min-h-8 min-w-0 items-center gap-1 rounded-md text-xs font-bold text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">←</span>
          <span className="max-w-52 truncate">{backLabel}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-sm border border-line bg-card px-1.5 py-0.5 font-mono text-xs font-bold text-ink tabular-nums">
            {index + 1}
            <span className="text-ink-muted"> / {total}</span>
          </span>
          <span className="rounded-sm border border-line bg-card px-1.5 py-0.5 font-mono text-xs font-bold text-sage tabular-nums">
            ✓ {score}
          </span>
          {combo >= 2 && (
            <span className="inline-flex items-center gap-0.5 rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-xs font-bold text-accent-ink tabular-nums">
              <FlameIcon size={12} className="text-accent" />×{combo}
            </span>
          )}
          {sessionXp !== null && (
            <span className="rounded-sm border border-brass/40 bg-gold/40 px-1.5 py-0.5 font-mono text-xs font-bold text-primary tabular-nums dark:border-accent/30 dark:bg-accent/15 dark:text-accent">
              +{shownXp} XP
            </span>
          )}
          {actions}
        </div>
      </div>

      <div>
        <div
          className="h-2 overflow-hidden rounded-full bg-raised"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Session progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right font-mono text-2xs font-bold tracking-widest text-ink-muted tabular-nums">
          {pct}%
        </p>
      </div>
    </div>
  )
}
