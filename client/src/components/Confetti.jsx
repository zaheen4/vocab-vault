import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#ee964b', '#28324e', '#faf0ca', '#34d399', '#f472b6', '#60a5fa']

// Renders a one-shot confetti burst. `active` toggles a new burst.
export default function Confetti({ active = false, pieces = 60 }) {
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (active) setBurst((b) => b + 1)
  }, [active])

  const drops = useMemo(() => {
    if (!burst) return []
    return Array.from({ length: pieces }, (_, i) => {
      const colors = COLORS
      return {
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
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
            backgroundColor: d.color,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            transform: `rotate(${d.rotate}deg)`,
          }}
        />
      ))}
    </>
  )
}
