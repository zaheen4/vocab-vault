import { useState } from 'react'
import { cn } from '../../utils/cn'

function EyeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

// Single shared text input: focus ring, dark surface, icon slot, error state,
// password visibility toggle, labelRight slot.
export default function Input({
  label,
  labelRight,
  icon,
  error,
  as,
  className = '',
  inputClassName = '',
  id,
  type = 'text',
  showPasswordToggle = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : type

  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  const fieldClass = cn(
    // 16px on touch (text-base): iOS Safari auto-zooms smaller fields and
    // breaks layout on focus. Desktop keeps text-sm density.
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 sm:text-sm',
    'transition-colors focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none',
    'dark:border-white/15 dark:bg-night-800 dark:text-cream-100 dark:placeholder:text-cream-300/40 dark:focus:border-accent',
    icon && 'pl-9',
    isPassword && showPasswordToggle && 'pr-10',
    error && 'border-red-400 focus:border-red-400 focus:ring-red-400/30 dark:border-red-400/60',
    inputClassName
  )

  const field =
    as === 'textarea' ? (
      <textarea id={inputId} {...props} aria-invalid={error ? true : undefined} className={fieldClass} />
    ) : (
      <input id={inputId} type={effectiveType} {...props} aria-invalid={error ? true : undefined} className={fieldClass} />
    )

  return (
    <label className={cn('block', className)} htmlFor={inputId}>
      {(label || labelRight) && (
        <span className="mb-1 flex items-center justify-between text-sm font-medium">
          {label && <span className="text-slate-700 dark:text-cream-300">{label}</span>}
          {labelRight}
        </span>
      )}
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-cream-300/60">
            {icon}
          </span>
        )}
        {field}
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-cream-300/60 dark:hover:text-cream-100"
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        )}
      </span>
      {error && (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-300">{error}</span>
      )}
    </label>
  )
}
