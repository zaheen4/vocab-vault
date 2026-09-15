import { useEffect } from 'react'
import { cn } from '../../utils/cn'

// Lightweight status toast. Auto-dismisses; pass onDismiss to render a close
// control. Voice surface per DESIGN_SYSTEM, so it reads in font-display.
// className override lets stacked contexts (e.g. bookmarks select mode with
// its sticky BatchBar) lift the toast clear of bottom-anchored chrome.
export default function Toast({ message, variant = 'info', onDismiss, duration = 5000, className = '' }) {
  useEffect(() => {
    if (!onDismiss || duration == null) return undefined
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const tone =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-950/80 dark:text-red-300'
      : variant === 'gold'
        ? 'border-accent bg-gold text-primary dark:border-accent/40 dark:bg-night-800 dark:text-accent'
        : 'border-slate-200 bg-white text-primary dark:border-white/15 dark:bg-night-800 dark:text-cream-100'

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border-2 px-4 py-3 font-display text-sm font-bold shadow-lg',
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
