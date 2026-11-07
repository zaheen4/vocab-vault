import { cn } from '../../utils/cn'

const base =
  'inline-flex min-h-11 items-center justify-center px-4 py-2 font-display text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const variants = {
  primary: 'bg-accent text-primary hover:brightness-95 dark:text-night-950',
  secondary:
    'border border-line bg-card text-ink hover:bg-raised',
  danger:
    'border border-stamp/30 bg-stamp/10 text-stamp hover:bg-stamp/15',
  success:
    'border border-sage/30 bg-sage/10 text-sage hover:bg-sage/15',
  stamp: 'bg-stamp text-white hover:brightness-95 dark:text-night-950',
  ghost: 'text-accent-ink hover:underline',
}

const tactileEdge = {
  primary: 'border-accent-deep',
  secondary: 'border-line',
  danger: 'border-stamp/60',
  success: 'border-sage/60',
  stamp: 'border-stamp-deep',
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
  const tactile = variant !== 'ghost' && (chunky || variant === 'primary')
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
