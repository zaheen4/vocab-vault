import { cn } from '../../utils/cn'

export default function OptionTile({
  pressed = false,
  swatch,
  label,
  hint,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'min-h-11 rounded-md border p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        pressed
          ? 'border-accent-ink bg-accent/10'
          : 'border-line-strong bg-raised/50 hover:bg-raised',
        className
      )}
      {...props}
    >
      {swatch && (
        <span
          aria-hidden="true"
          className={cn('block h-6 w-full rounded-sm border border-line', swatch)}
        />
      )}
      {label && (
        <span className="mt-1.5 block font-display text-xs font-bold text-ink">
          {label}
        </span>
      )}
      {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
    </button>
  )
}
