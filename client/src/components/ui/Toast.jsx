import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { MOTION, m } from '../../lib/motion'

const toastMotion = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.base, ease: MOTION.easeOut },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: MOTION.fast, ease: MOTION.easeOut },
  },
}

export default function Toast({ message, variant = 'info', onDismiss, duration = 5000, className = '' }) {
  const liveRef = useRef(null)

  useEffect(() => {
    if (!onDismiss || duration == null) return undefined
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = message || ''
  }, [message])

  const tone =
    variant === 'error'
      ? 'border-stamp/40 bg-stamp/10 text-stamp'
      : variant === 'gold'
        ? 'border-accent/40 bg-gold text-primary dark:bg-raised dark:text-brass'
        : 'border-line bg-card text-ink'

  return (
    <>
      <div ref={liveRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
      <m.div
        className={cn(
          'fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border-2 px-4 py-3 font-display text-sm font-bold shadow-lg sm:bottom-4',
          tone,
          className
        )}
        {...toastMotion}
      >
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded text-base leading-none text-ink-muted hover:text-ink"
          >
            ✕
          </button>
        )}
      </m.div>
    </>
  )
}
