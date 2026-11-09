import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePrefetchDeck, usePrefetchQuizPool } from '../api/queries'
import { noteTabSwitch } from '../utils/navDirection'

const tabs = [
  { to: (id) => `/decks/${id}`, label: 'Practice', end: true, warm: 'session' },
  { to: (id) => `/decks/${id}/quiz`, label: 'Quiz', warm: 'pool' },
  { to: (id) => `/decks/${id}/typing`, label: 'Typing', warm: 'pool' },
]

function activeLabel(pathname, deckId) {
  const hit = tabs.find(({ to, end }) => {
    const target = to(deckId)
    return end ? pathname === target : pathname === target || pathname.startsWith(`${target}/`)
  })
  return hit ? hit.label : tabs[0].label
}

let lastGeometry = null

export default function ModeTabs({ deckId }) {
  const prefetchDeck = usePrefetchDeck()
  const prefetchPool = usePrefetchQuizPool()
  const { pathname, search } = useLocation()
  const warm = (kind) => () => (kind === 'session' ? prefetchDeck(deckId) : prefetchPool(deckId))
  const current = activeLabel(pathname, deckId)
  const tabRefs = useRef({})
  const [pill, setPill] = useState(() => (lastGeometry ? { ...lastGeometry, fresh: false } : null))

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[current]
      if (!el) return
      const next = { x: el.offsetLeft, w: el.offsetWidth }
      lastGeometry = next
      setPill((prev) => {
        if (prev && prev.x === next.x && prev.w === next.w) return prev
        return { ...next, fresh: !prev }
      })
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', measure)
  }, [current])

  return (
    <nav
      aria-label="Study modes"
      className="relative flex min-w-0 items-center gap-1 rounded-full border border-line bg-card p-1 shadow-paper dark:shadow-none"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-0 rounded-full bg-accent transition-all duration-250 ease-out motion-reduce:transition-none"
        style={
          pill
            ? {
                transform: `translateX(${pill.x}px)`,
                width: pill.w,
                opacity: 1,
                transition: pill.fresh ? 'none' : undefined,
              }
            : { opacity: 0 }
        }
      />
      {tabs.map(({ to, label, end, warm: kind }) => (
        <NavLink
          key={label}
          ref={(el) => {
            if (el) tabRefs.current[label] = el
            else delete tabRefs.current[label]
          }}
          to={{ pathname: to(deckId), search }}
          end={end}
          onMouseEnter={warm(kind)}
          onFocus={warm(kind)}
          onClick={() => noteTabSwitch(pathname, to(deckId))}
          className={({ isActive }) =>
            `relative z-10 min-h-9 rounded-full px-3 py-1.5 font-display text-xs font-bold transition-colors before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] sm:text-sm ${
              isActive
                ? 'text-primary dark:text-night-950'
                : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
