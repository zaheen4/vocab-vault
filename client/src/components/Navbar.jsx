import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import Button from './ui/Button'

const linkClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-sm font-medium transition-colors ${
    isActive ? 'bg-gold text-primary' : 'text-slate-600 hover:text-primary'
  }`

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
