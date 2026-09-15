import { Link } from 'react-router-dom'
import { useCountUp } from '../utils/countUp'

// Shared session HUD, v2: one compact header row (back, counter with live
// score/combo/XP, optional actions) plus a full-width progress bar with pct.
// No separate pill strip — it cost ~50px on phones for info the row carries.
// Practice/Quiz/Typing share it; SavedPractice stays bespoke (no bar).
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
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <Link
          to={backTo}
          className="truncate text-slate-400 hover:text-primary dark:text-cream-300/60 dark:hover:text-cream-100"
        >
          ← {backLabel}
        </Link>
        <span className="flex items-center gap-2 text-slate-400 dark:text-cream-300/60">
          <span className="font-semibold text-slate-600 tabular-nums dark:text-cream-100">
            {index + 1} / {total} · ✓ {score}
            {combo >= 2 && <span className="text-accent"> · 🔥×{combo}</span>}
          </span>
          {sessionXp !== null && (
            <span className="rounded bg-gold px-1.5 py-0.5 text-xs font-bold text-primary tabular-nums dark:bg-accent/20 dark:text-accent">
              +{shownXp} XP
            </span>
          )}
          {actions}
        </span>
      </div>

      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-night-800">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-slate-400 tabular-nums dark:text-cream-300/60">
          {pct}%
        </p>
      </div>
    </>
  )
}
