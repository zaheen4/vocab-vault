import { Link } from 'react-router-dom'

// Shared session HUD: back link + position/score, stat strip, progress bar.
// Practice/Quiz/Typing render the same moment; SavedPractice stays bespoke
// (no bar by design). Combo/XP pills and header actions are optional slots.
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
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <Link
          to={backTo}
          className="text-slate-400 hover:text-primary dark:text-cream-300/60 dark:hover:text-cream-100"
        >
          ← {backLabel}
        </Link>
        <span className="flex items-center gap-2 text-slate-400 dark:text-cream-300/60">
          <span>
            {index + 1} / {total} · ✓ {score}
          </span>
          {actions}
        </span>
      </div>

      {(combo >= 2 || sessionXp !== null) && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-night-900">
          {combo >= 2 && (
            <span className="animate-pop rounded-full bg-accent px-2 py-0.5 text-primary dark:text-night-950">
              {combo} combo 🔥
            </span>
          )}
          {sessionXp !== null && (
            <span className="ml-auto rounded bg-gold px-2 py-0.5 text-primary dark:bg-accent/20 dark:text-accent">
              +{sessionXp} XP
            </span>
          )}
        </div>
      )}

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-night-800">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${total === 0 ? 0 : (index / total) * 100}%` }}
        />
      </div>
    </>
  )
}
