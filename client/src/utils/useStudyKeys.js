import { useEffect, useRef } from 'react'
import { resolveStudyKey } from './studyKeys'

// Subscribes once per session screen and translates the key map into the
// caller's actions. Handlers live in a ref so re-renders never re-bind keys.
const ACTION_HANDLER = {
  flip: 'onFlip',
  again: 'onAgain',
  'got-it': 'onGotIt',
  speak: 'onSpeak',
  reverse: 'onReverse',
  bookmark: 'onBookmark',
}

export function useStudyKeys({
  enabled = true,
  flipped = false,
  hasFeedback = false,
  onFlip,
  onAgain,
  onGotIt,
  onSpeak,
  onReverse,
  onBookmark,
} = {}) {
  const handlers = useRef({})

  // Handlers change every render (they close over fresh state); refresh the ref
  // after paint so the key listener always calls the latest ones without
  // re-binding, and never touch a ref during render.
  useEffect(() => {
    handlers.current = { onFlip, onAgain, onGotIt, onSpeak, onReverse, onBookmark }
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const action = resolveStudyKey({
        key: event.key,
        flipped,
        hasFeedback,
        enabled,
        target: event.target,
      })
      if (!action) return
      const handler = handlers.current[ACTION_HANDLER[action]]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, flipped, hasFeedback])
}
