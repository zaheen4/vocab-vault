import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import Logo from './Logo'
import Button from './ui/Button'

const linkClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-sm font-medium transition-colors ${
    isActive ? 'bg-gold text-primary' : 'text-slate-600 hover:text-primary'
  }`

function StatsChip() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let cancelled = false
    api
      .get('/gamification/me')
      .then((data) => !cancelled && setStats(data.gamification))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  if (!stats) return null
  return (
    <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex">
      <span className="rounded bg-gold px-1.5 py-0.5">⭐ {stats.level}</span>
      {stats.dailyStreak > 0 && <span>🔥 {stats.dailyStreak}d</span>}
      <span className="text-slate-400">+{stats.xp} XP</span>
    </span>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-lg font-bold text-primary">VocabVault</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <NavLink to="/" end className={linkClass}>
              Decks
            </NavLink>
            <NavLink to="/search" className={linkClass}>
              Search
            </NavLink>
            <NavLink to="/progress" className={linkClass}>
              Progress
            </NavLink>
            <StatsChip />
            <span className="text-sm text-slate-500">{user.name}</span>
            <button
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-primary"
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
