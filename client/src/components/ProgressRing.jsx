import { useReducedMotion } from '../lib/motion'

const RADIUS = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProgressRing({
  pct = 0,
  size = 32,
  strokeWidth = 3.5,
  className = '',
  children,
}) {
  const reduceMotion = useReducedMotion()
  const filled = Math.max(0, Math.min(1, pct)) * CIRCUMFERENCE
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r={RADIUS} fill="none" strokeWidth={strokeWidth} className="stroke-line" />
        <circle
          cx="16"
          cy="16"
          r={RADIUS}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-accent"
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          style={{
            transition: reduceMotion ? 'none' : 'stroke-dasharray 500ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex items-center justify-center">{children}</span>
      )}
    </span>
  )
}
