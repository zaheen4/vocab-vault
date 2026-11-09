import { cn } from '../../utils/cn'

export default function Checkbox({
  label,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? `cb-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 text-sm',
        props.disabled ? 'cursor-not-allowed text-ink-muted' : 'cursor-pointer text-ink',
        className
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className="size-4 rounded border-line accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  )
}
