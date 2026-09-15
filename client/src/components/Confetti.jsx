import { useEffect, useMemo, useState } from 'react'

const COLORS = [
  'var(--color-accent)',
  'var(--color-primary)',
  'var(--color-gold)',
  'var(--color-emerald-400)',
  'var(--color-pink-400)',
  'var(--color-blue-400)',
]

// Renders a one-shot confetti burst. `active` toggles a new burst.
// Burst-from-center: pieces spawn in a bell around the middle, fan outward
// via --drift, and spin. Shapes alternate rect/circle. Seeded per burst
// index so StrictMode double-effects don't permanently diverge the layout.
function mulberry(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Renders a one-shot confetti burst. `active` toggles a new burst.
export default function Confetti({ active = false, pieces = 70 }) {
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (active) setBurst((b) => b + 1)
  }, [active])

  const drops = useMemo(() => {
    if (!burst) return []
    const rand = mulberry(burst * 7919 + pieces)
    return Array.from({ length: pieces }, (_, i) => {
      // Triangular center bias: (r1+r2+r3)/3 clusters spawns mid-screen.
      const center = (rand() + rand() + rand()) / 3
      return {
        id: `${burst}-${i}`,
        left: 8 + center * 84,
        delay: rand() * 0.5,
        duration: 2.2 + rand() * 1.6,
        drift: Math.round((rand() - 0.5) * 260),
        size: 7 + Math.floor(rand() * 8),
        circle: i % 3 === 0,
        color: COLORS[i % COLORS.length],
        rotate: Math.floor(rand() * 360),
      }
    })
  }, [burst, pieces])

  if (!burst) return null

  return (
    <>
      {drops.map((d) => (
        <span
          key={d.id}
          className="confetti-piece"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.circle ? d.size : Math.round(d.size * 1.4),
            borderRadius: d.circle ? '50%' : 2,
            backgroundColor: d.color,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            '--drift': `${d.drift}px`,
            transform: `rotate(${d.rotate}deg)`,
          }}
        />
      ))}
    </>
  )
}
