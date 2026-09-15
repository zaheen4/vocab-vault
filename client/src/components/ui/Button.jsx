import { cn } from '../../utils/cn'

const base =
  'inline-flex min-h-11 items-center justify-center px-4 py-2 font-display text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const variants = {
  primary: 'bg-accent text-primary hover:brightness-95 dark:text-night-950',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-night-800 dark:text-cream-100 dark:hover:bg-night-800/70',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-400/30 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950/70',
  success:
    'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950/70',
}

// Primary is always tactile. Other variants go tactile only with chunky.
// Radius is chosen in one place so rounded-md and rounded-xl never collide
// in a class list (cn() joins without deduping).
const tactileEdge = {
  primary: 'border-accent-deep',
  secondary: 'border-slate-400',
  danger: 'border-red-800',
  success: 'border-emerald-800',
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  chunky = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const tactile = chunky || variant === 'primary'
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant] || variants.primary,
        tactile
          ? cn(
              'rounded-xl border-b-4 active:translate-y-1 active:border-b-0',
              tactileEdge[variant] || tactileEdge.primary
            )
          : 'rounded-md',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2" role="status">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
            />
          </svg>
          {typeof children === 'string' ? children : 'Loading'}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
