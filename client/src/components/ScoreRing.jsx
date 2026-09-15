import { useCountUp } from '../utils/countUp'

// Shared end-of-session score ring: animated count-up number plus a ring
// that fills with it. Used by all four study modes so results read the same.
export default function ScoreRing({ correct, total }) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const shown = useCountUp(pct)
  const r = 52
  const c = 2 * Math.PI * r
  const filled = (shown / 100) * c
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-slate-200)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={
            pct >= 70
              ? 'var(--color-emerald-400)'
              : pct >= 40
                ? 'var(--color-accent)'
                : 'var(--color-red-400)'
          }
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ transition: 'stroke-dasharray 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-primary dark:text-cream-100">{shown}%</span>
        <span className="text-xs text-slate-400 dark:text-cream-300/60">
          {correct}/{total}
        </span>
      </div>
    </div>
  )
}
