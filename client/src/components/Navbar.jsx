import { Link, NavLink, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useGamification } from '../api/queries'
import { pickSeeded } from './art/seed'
import { TILE_STYLES } from './DeckTile'
import Logo from './Logo'
import Button from './ui/Button'

const linkClass = ({ isActive }) =>
  `rounded-md px-2 py-1 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gold text-primary dark:bg-accent/20 dark:text-accent'
      : 'text-slate-600 hover:text-primary dark:text-cream-300 dark:hover:text-cream-100'
  }`

const DESKTOP_LINKS = [
  { to: '/', end: true, label: 'Decks' },
  { to: '/search', end: false, label: 'Search' },
  { to: '/bookmarks', end: false, label: 'Saved' },
  { to: '/progress', end: false, label: 'Progress' },
]

const TABS = [
  { to: '/', end: true, label: 'Decks', glyph: 'M4 5h16v14H4z M4 9h16' },
  { to: '/search', end: false, label: 'Search', glyph: 'M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M15.5 15.5 20 20' },
  { to: '/bookmarks', end: false, label: 'Saved', glyph: 'M7 4h10v16l-5-3.5L7 20z' },
  { to: '/progress', end: false, label: 'Progress', glyph: 'M5 19V12 M12 19V5 M19 19v-6' },
]

function TabGlyph({ d }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

function StatsChip() {
  // Shared ['gamification','me'] cache with hero and progress: one request,
  // refreshed by review-post invalidation instead of per-route refetching.
  const { data: stats } = useGamification()
  if (!stats) return null
  const ringPct = stats.progressToNext || 0
  const r = 13
  const c = 2 * Math.PI * r
  return (
    <>
      <span
        className="relative inline-flex h-9 w-9 items-center justify-center"
        title={`Level ${stats.level} · ${stats.dailyStreak > 0 ? `${stats.dailyStreak}d streak · ` : ''}${Math.round(ringPct * 100)}% to next`}
        aria-label={`Level ${stats.level}${stats.dailyStreak > 0 ? `, ${stats.dailyStreak} day streak` : ''}, ${Math.round(ringPct * 100)} percent to next level`}
      >
        <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="16" cy="16" r={r} fill="none" strokeWidth="3.5" className="stroke-slate-200 dark:stroke-white/15" />
          <circle
            cx="16"
            cy="16"
            r={r}
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="stroke-accent"
            strokeDasharray={`${ringPct * c} ${c}`}
          />
        </svg>
        <span className="text-xs font-bold text-primary dark:text-cream-100">{stats.level}</span>
      </span>
    </>
  )
}

function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const tile = pickSeeded(TILE_STYLES, user._id ?? user.email) ?? TILE_STYLES[0]
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Account: ${user.name}`}
          title={user.name}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tile}`}
        >
          {(user.name || '?').trim().charAt(0).toUpperCase()}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-night-900 dark:shadow-none"
        >
          <div className="px-2.5 py-2">
            <p className="truncate font-display text-sm font-bold text-primary dark:text-cream-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-cream-300/70">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-white/10" />
          <DropdownMenu.Item
            onSelect={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="flex cursor-pointer items-center rounded-md px-2.5 py-2 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 dark:text-cream-100 dark:hover:bg-white/10 dark:focus:bg-white/10"
          >
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-white/10 dark:bg-night-900/95"
    >
      <div className="grid grid-cols-4">
        {TABS.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors ${
                isActive ? 'text-accent-deep dark:text-accent' : 'text-slate-400 dark:text-cream-300/60'
              }`
            }
          >
            <TabGlyph d={t.glyph} />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <>
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-night-900">
        <nav className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 justify-self-start">
            <Logo size={26} />
            <span className="truncate font-display text-lg font-bold text-primary dark:text-cream-100">VocabVault</span>
          </Link>

          {user ? (
            <>
              <div className="hidden min-w-0 items-center gap-1 sm:flex" aria-label="Primary">
                {DESKTOP_LINKS.map((l) => (
                  <NavLink key={l.label} to={l.to} end={l.end} className={linkClass}>
                    {l.label}
                  </NavLink>
                ))}
              </div>
              <div className="col-start-3 flex items-center gap-2 justify-self-end sm:gap-3">
                <StatsChip />
                <ThemeToggle theme={theme} onToggle={toggle} />
                <AccountMenu />
              </div>
            </>
          ) : (
            <div className="col-start-3 flex items-center gap-3 justify-self-end">
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
      {user && <MobileTabBar />}
    </>
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
