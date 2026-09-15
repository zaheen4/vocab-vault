import { useEffect } from 'react'

// Lightweight status toast. Auto-dismisses; pass onDismiss to render a close
// control. Voice surface per DESIGN_SYSTEM, so it reads in font-display.
export default function Toast({ message, variant = 'info', onDismiss, duration = 5000 }) {
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
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border-2 px-4 py-3 font-display text-sm font-bold shadow-lg ${tone}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-base leading-none opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}
