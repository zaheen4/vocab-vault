import { useEffect, useRef, useState } from 'react'

export function easeOutCubic(t) {
  const c = Math.min(Math.max(t, 0), 1)
  return 1 - (1 - c) ** 3
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0
  )
  const shown = useRef(value)

  useEffect(() => {
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      shown.current = target
      setValue(target)
      return undefined
    }
    const from = shown.current
    if (from === target) return undefined
    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const t = (now - start) / duration
      if (t >= 1) {
        shown.current = target
        setValue(target)
        return
      }
      const next = Math.round(from + (target - from) * easeOutCubic(t))
      shown.current = next
      setValue(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
