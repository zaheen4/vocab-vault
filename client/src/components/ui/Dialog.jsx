import { useEffect, useRef } from 'react'
import Card from './Card'

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/60 p-4 backdrop-blur-xs"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="w-full max-w-md focus:outline-none"
      >
        <Card className="p-6">
          {children}
        </Card>
      </div>
    </div>
  )
}
