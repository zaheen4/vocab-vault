import { LazyMotion, MotionConfig, domMax, m, useReducedMotion } from 'motion/react'

// Single source of truth for motion timing. The same numbers are mirrored as
// CSS custom properties in index.css; update both together.
// Policy: docs/DESIGN_SYSTEM.md § Motion.
export const MOTION = {
  fast: 0.12,
  base: 0.18,
  slow: 0.24,
  easeOut: [0.22, 1, 0.36, 1],
}

const baseTransition = {
  type: 'tween',
  duration: MOTION.base,
  ease: MOTION.easeOut,
}

// `strict` makes a stray `motion.*` import fail loudly: the app must use `m`
// so the lazy feature bundle stays in charge of what ships.
export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={baseTransition}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

export { m, useReducedMotion }
