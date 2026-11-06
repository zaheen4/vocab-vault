import { cn } from '../../utils/cn'

// Toggle chip for filter rows (Home library, lists). `pressed` maps to
// aria-pressed so screen readers announce the current filter.
export default function Chip({ pressed = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        pressed
          ? 'border-accent bg-accent/15 text-accent-ink'
          : 'border-line bg-card text-ink-muted hover:text-ink',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
