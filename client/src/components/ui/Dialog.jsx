import { useEffect, useId, useRef } from 'react'
import Card from './Card'
import { MOTION, m } from '../../lib/motion'

const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: MOTION.fast } },
  exit: { opacity: 0, transition: { duration: MOTION.fast } },
}

const panel = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: MOTION.base, ease: MOTION.easeOut },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: MOTION.fast, ease: MOTION.easeOut },
  },
}

export default function Dialog({ labelledBy, onClose, children }) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  const generatedTitleId = useId()
  const titleId = labelledBy || generatedTitleId

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousActiveElement = document.activeElement
    const panel = panelRef.current
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusable = () => Array.from(panel?.querySelectorAll(focusableSelector) || [])
    const initialFocus = focusable()[0] || panel

    initialFocus?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const items = focusable()
      if (items.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  }, [])

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      closeRef.current?.()
    }
  }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/60 p-4 backdrop-blur-xs"
      onMouseDown={handleBackdropMouseDown}
      {...backdrop}
    >
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md focus:outline-none"
        {...panel}
      >
        {!labelledBy && <span id={titleId} className="sr-only">Dialog</span>}
        <Card className="p-6">
          {children}
        </Card>
      </m.div>
    </m.div>
  )
}
