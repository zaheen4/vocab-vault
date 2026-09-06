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

export default function ModeTabs({ deckId }) {
  const prefetchDeck = usePrefetchDeck()
  const prefetchPool = usePrefetchQuizPool()
  const { pathname } = useLocation()
  const warm = (kind) => () => (kind === 'session' ? prefetchDeck(deckId) : prefetchPool(deckId))
  const current = activeLabel(pathname, deckId)
  const tabRefs = useRef({})
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[current]
      if (!el) return
      setPill((prev) => {
        const next = { x: el.offsetLeft, w: el.offsetWidth }
        return prev && prev.x === next.x && prev.w === next.w ? prev : next
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
      className="relative flex justify-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-0 rounded-full bg-accent transition-[transform,width] duration-250 ease-out motion-reduce:transition-none"
        style={
          pill
            ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 }
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
          to={to(deckId)}
          end={end}
          onMouseEnter={warm(kind)}
          onFocus={warm(kind)}
          onClick={() => noteTabSwitch(pathname, to(deckId))}
          className={({ isActive }) =>
            `relative z-10 rounded-full px-4 py-1.5 font-display text-sm font-bold transition-colors ${
              isActive ? 'text-primary' : 'text-slate-500 hover:text-primary'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
