import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousActiveElement = document.activeElement
    panelRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
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
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="w-full max-w-md focus:outline-none"
        {...panel}
      >
        <Card className="p-6">
          {children}
        </Card>
      </m.div>
    </m.div>
  )
}
