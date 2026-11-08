import { useCountUp } from '../utils/countUp'

export default function ScoreRing({ correct, total }) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const shown = useCountUp(pct)
  const r = 52
  const c = 2 * Math.PI * r
  const filled = (shown / 100) * c
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-line" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          className={pct >= 70 ? 'text-sage' : pct >= 40 ? 'text-brass' : 'text-stamp'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ transition: 'stroke-dasharray 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-ink">{shown}%</span>
        <span className="text-xs text-ink-muted">
          {correct}/{total}
        </span>
      </div>
    </div>
  )
}
