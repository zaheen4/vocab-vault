import { LazyMotion, MotionConfig, domMax, m, useReducedMotion } from 'motion/react'

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
