import { MOTION, m } from '../../lib/motion'

export default function Disclosure({ open, className = '', children }) {
  if (!open) return null
  return (
    <m.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.fast, ease: MOTION.easeOut }}
      className={className}
    >
      {children}
    </m.div>
  )
}
