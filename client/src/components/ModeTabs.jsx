import { NavLink } from 'react-router-dom'

const tabs = [
  { to: (id) => `/decks/${id}`, label: 'Practice', end: true },
  { to: (id) => `/decks/${id}/quiz`, label: 'Quiz' },
  { to: (id) => `/decks/${id}/typing`, label: 'Typing' },
]

// Single menu for the three deck study modes. Rendered on Practice, Quiz
// and Typing pages so every mode is one tap from every mode.
export default function ModeTabs({ deckId }) {
  return (
    <nav aria-label="Study modes" className="flex justify-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map(({ to, label, end }) => (
        <NavLink
          key={label}
          to={to(deckId)}
          end={end}
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
