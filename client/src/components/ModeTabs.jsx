import { NavLink } from 'react-router-dom'
import { usePrefetchDeck, usePrefetchQuizPool } from '../api/queries'

const tabs = [
  { to: (id) => `/decks/${id}`, label: 'Practice', end: true, warm: 'session' },
  { to: (id) => `/decks/${id}/quiz`, label: 'Quiz', warm: 'pool' },
  { to: (id) => `/decks/${id}/typing`, label: 'Typing', warm: 'pool' },
]

export default function ModeTabs({ deckId }) {
  const prefetchDeck = usePrefetchDeck()
  const prefetchPool = usePrefetchQuizPool()
  const warm = (kind) => () => (kind === 'session' ? prefetchDeck(deckId) : prefetchPool(deckId))
  return (
    <nav aria-label="Study modes" className="flex justify-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map(({ to, label, end, warm: kind }) => (
        <NavLink
          key={label}
          to={to(deckId)}
          end={end}
          onMouseEnter={warm(kind)}
          onFocus={warm(kind)}
          className={({ isActive }) =>
            `rounded-full px-4 py-1.5 font-display text-sm font-bold transition-colors ${
              isActive ? 'bg-accent text-primary' : 'text-slate-500 hover:text-primary'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
