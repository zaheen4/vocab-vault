import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useGamification } from '../api/queries'
import Logo from './Logo'
import Button from './ui/Button'

const linkClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gold text-primary dark:bg-accent/20 dark:text-accent'
      : 'text-slate-600 hover:text-primary dark:text-cream-300 dark:hover:text-cream-100'
  }`

function StatsChip() {
  // Shared ['gamification','me'] cache with hero and progress: one request,
  // refreshed by review-post invalidation instead of per-route refetching.
  const { data: stats } = useGamification()
  if (!stats) return null
  return (
    <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex dark:border-white/10 dark:bg-night-800 dark:text-cream-100">
      <span className="rounded bg-gold px-1.5 py-0.5 dark:bg-accent/20 dark:text-accent">⭐ {stats.level}</span>
      {stats.dailyStreak > 0 && <span>🔥 {stats.dailyStreak}d</span>}
      <span className="text-slate-400 dark:text-cream-300/70">+{stats.xp} XP</span>
    </span>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-night-900">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-display text-lg font-bold text-primary dark:text-cream-100">VocabVault</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <NavLink to="/" end className={linkClass}>
              Decks
            </NavLink>
            <NavLink to="/search" className={linkClass}>
              Search
            </NavLink>
            <NavLink to="/bookmarks" className={linkClass}>
              Saved
            </NavLink>
            <NavLink to="/progress" className={linkClass}>
              Progress
            </NavLink>
            <StatsChip />
            <ThemeToggle theme={theme} onToggle={toggle} />
            <span className="text-sm text-slate-500 dark:text-cream-300/80">{user.name}</span>
            <Button
              variant="secondary"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={toggle} />
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-primary dark:text-cream-300 dark:hover:text-cream-100"
            >
              Log in
            </Link>
            <Link to="/register" className="inline-flex">
              <Button>Register</Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-accent hover:text-accent-deep dark:border-white/10 dark:bg-night-800 dark:text-cream-300 dark:hover:border-accent dark:hover:text-accent"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  )
}
