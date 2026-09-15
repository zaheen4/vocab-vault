import { cn } from '../../utils/cn'

// Single shared text input: focus ring, dark surface, icon slot, error state.
// Replaces the five copy-pasted inputClass strings (Login/Register/Search/
// Bookmarks/AddWord) so input styling can never drift again.
export default function Input({
  label,
  icon,
  error,
  as,
  className = '',
  inputClassName = '',
  id,
  ...props
}) {
  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  const fieldClass = cn(
    // 16px on touch (text-base): iOS Safari auto-zooms smaller fields and
    // breaks layout on focus. Desktop keeps text-sm density.
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 sm:text-sm',
    'transition-colors focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none',
    'dark:border-white/15 dark:bg-night-800 dark:text-cream-100 dark:placeholder:text-cream-300/40 dark:focus:border-accent',
    icon && 'pl-9',
    error && 'border-red-400 focus:border-red-400 focus:ring-red-400/30 dark:border-red-400/60',
    inputClassName
  )
  const field =
    as === 'textarea' ? (
      <textarea id={inputId} {...props} aria-invalid={error ? true : undefined} className={fieldClass} />
    ) : (
      <input id={inputId} {...props} aria-invalid={error ? true : undefined} className={fieldClass} />
    )
  return (
    <label className={cn('block', className)} htmlFor={inputId}>
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-cream-300">
          {label}
        </span>
      )}
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-cream-300/60">
            {icon}
          </span>
        )}
        {field}
      </span>
      {error && (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-300">{error}</span>
      )}
    </label>
  )
}
