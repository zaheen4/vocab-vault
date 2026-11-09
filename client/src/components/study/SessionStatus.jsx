import { useCountUp } from '../../utils/countUp'
import { sessionProgress } from '../../utils/studySession'
import { FlameIcon } from '../art/icons'

const chip =
  'rounded-sm border border-line bg-card px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums'

export default function SessionStatus({
  index = 0,
  total = 0,
  score = 0,
  combo = 0,
  xp = null,
  actions = null,
}) {
  const shownXp = useCountUp(xp ?? 0)
  const pct = sessionProgress(index, total)

  return (
    <div className="space-y-1">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <span className={`${chip} text-ink`}>
            {index + 1}
            <span className="text-ink-muted"> / {total}</span>
          </span>
          <span className={`${chip} text-sage`}>✓ {score}</span>
          {combo >= 2 && (
            <span className="inline-flex items-center gap-0.5 rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-xs font-bold text-accent-ink tabular-nums">
              <FlameIcon size={12} className="text-accent" />×{combo}
            </span>
          )}
          {xp !== null && (
            <span className="rounded-sm border border-brass/40 bg-gold/40 px-1.5 py-0.5 font-mono text-xs font-bold text-primary tabular-nums dark:border-accent/30 dark:bg-accent/15 dark:text-accent">
              +{shownXp} XP
            </span>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        )}
      </div>

      <div
        className="h-0.5 overflow-hidden rounded-full bg-raised"
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
    </div>
  )
}
