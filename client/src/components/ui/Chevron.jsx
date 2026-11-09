import { MOTION, m } from '../../lib/motion'

export default function Chevron({ open = false, className = '' }) {
  return (
    <m.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{ rotate: open ? 0 : -90 }}
      transition={{ duration: MOTION.fast, ease: MOTION.easeOut }}
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </m.svg>
  )
}
