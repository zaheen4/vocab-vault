import { useEffect } from 'react'
import { cn } from '../../utils/cn'

export default function Toast({ message, variant = 'info', onDismiss, duration = 5000, className = '' }) {
  useEffect(() => {
    if (!onDismiss || duration == null) return undefined
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const tone =
    variant === 'error'
      ? 'border-stamp/40 bg-stamp/10 text-stamp'
      : variant === 'gold'
        ? 'border-accent/40 bg-gold text-primary dark:bg-raised dark:text-brass'
        : 'border-line bg-card text-ink'

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border-2 px-4 py-3 font-display text-sm font-bold shadow-lg sm:bottom-4',
        tone,
        className
      )}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded text-base leading-none opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}
