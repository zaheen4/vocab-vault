import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useDueWords, useGamification } from '../api/queries'
import { isSectionActive } from '../utils/navSections'
import { pickSeeded } from './art/seed'
import { TILE_STYLES } from './DeckTile'
import Logo from './Logo'
import Button from './ui/Button'
import ThemeToggle from './ui/ThemeToggle'

const GLYPHS = {
  decks: 'M4 5h16v14H4z M4 9h16',
  review: 'M12 7v5l3 2 M21 12a9 9 0 1 1-3-6.7 M21 3v5h-5',
  search: 'M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M15.5 15.5 20 20',
  saved: 'M7 4h10v16l-5-3.5L7 20z',
  progress: 'M5 19V12 M12 19V5 M19 19v-6',
  history: 'M3 12a9 9 0 1 0 3-6.7 M3 4v5h5 M12 7v5l3 2',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M12 11v5 M12 8h.01',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
}

const DESKTOP_LINKS = [
  { to: '/', section: 'decks', label: 'Decks' },
  { to: '/practice/due', section: 'review', label: 'Review' },
  { to: '/search', section: 'search', label: 'Search' },
  { to: '/bookmarks', section: 'saved', label: 'Saved' },
  { to: '/progress', section: 'progress', label: 'Progress' },
]

const TABS = [
  { to: '/', section: 'decks', label: 'Decks', glyph: GLYPHS.decks },
  { to: '/practice/due', section: 'review', label: 'Review', glyph: GLYPHS.review },
  { to: '/search', section: 'search', label: 'Search', glyph: GLYPHS.search },
  { to: '/bookmarks', section: 'saved', label: 'Saved', glyph: GLYPHS.saved },
  { to: '/progress', section: 'progress', label: 'Progress', glyph: GLYPHS.progress },
]

function shortDue(count) {
  return count > 99 ? '99+' : String(count)
}

function Glyph({ d, size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
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
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <span
      className="relative inline-flex h-11 w-11 items-center justify-center"
      title={`Level ${stats.level} · ${stats.dailyStreak > 0 ? `${stats.dailyStreak}d streak · ` : ''}${Math.round(ringPct * 100)}% to next`}
      aria-label={`Level ${stats.level}${stats.dailyStreak > 0 ? `, ${stats.dailyStreak} day streak` : ''}, ${Math.round(ringPct * 100)} percent to next level`}
    >
      <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="16" cy="16" r={r} fill="none" strokeWidth="3.5" className="stroke-line" />
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
      <span className="text-xs font-bold text-ink">{stats.level}</span>
    </span>
  )
}

function DesktopLinks({ totalDue }) {
  const { pathname } = useLocation()
  return (
    <div
      className="hidden h-16 items-stretch gap-6 md:flex lg:gap-8"
      aria-label="Primary"
      role="navigation"
    >
      {DESKTOP_LINKS.map((item) => {
        const active = isSectionActive(pathname, item.section)
        const showDue = item.section === 'review' && totalDue > 0
        return (
          <Link
            key={item.label}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            aria-label={showDue ? `Review, ${totalDue} words due` : undefined}
            className={`group relative flex items-center gap-2 text-base transition-colors ${
              active
                ? 'font-bold text-ink'
                : 'font-medium text-ink-muted hover:text-ink'
            }`}
          >
            <span className="px-0.5">{item.label}</span>
            {showDue && (
              <span className="text-sm font-bold text-stamp tabular-nums">
                {shortDue(totalDue)}
              </span>
            )}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-px h-1 ${
                active ? 'bg-accent' : 'bg-transparent group-hover:bg-line'
              }`}
            />
          </Link>
        )
      })}
    </div>
  )
}

function MenuItem({ onSelect, glyph, children }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-ink transition-colors outline-none hover:bg-raised focus:bg-raised"
    >
      <Glyph d={glyph} size={16} className="shrink-0 text-ink-muted" />
      {children}
    </DropdownMenu.Item>
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
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-line font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tile}`}
        >
          {(user.name || '?').trim().charAt(0).toUpperCase()}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-60 rounded-xl border border-line bg-card p-1.5 shadow-paper"
        >
          <div className="px-2.5 py-2">
            <p className="truncate font-display text-sm font-bold text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <MenuItem onSelect={() => navigate('/progress')} glyph={GLYPHS.progress}>
            Progress
          </MenuItem>
          <MenuItem onSelect={() => navigate('/history')} glyph={GLYPHS.history}>
            History
          </MenuItem>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <MenuItem onSelect={() => navigate('/settings')} glyph={GLYPHS.settings}>
            Account settings
          </MenuItem>
          <MenuItem onSelect={() => navigate('/about')} glyph={GLYPHS.info}>
            About &amp; privacy
          </MenuItem>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <MenuItem
            onSelect={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            glyph={GLYPHS.logout}
          >
            Log out
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function MobileTabBar({ totalDue }) {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const active = isSectionActive(pathname, tab.section)
          const showDue = tab.section === 'review' && totalDue > 0
          return (
            <Link
              key={tab.label}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              aria-label={showDue ? `Review, ${totalDue} words due` : undefined}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs transition-colors ${
                active ? 'bg-accent/10 text-ink' : 'text-ink-muted'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 top-0 h-1 rounded-b-full bg-accent"
                />
              )}
              <Glyph
                d={tab.glyph}
                size={22}
                className={active ? 'text-accent-ink' : undefined}
              />
              <span className="flex items-center gap-1">
                <span className={active ? 'font-bold' : 'font-medium'}>{tab.label}</span>
                {showDue && (
                  <span className="font-mono text-xs font-bold text-stamp tabular-nums">
                    {shortDue(totalDue)}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const { data: dueData } = useDueWords(1)
  const totalDue = dueData?.totalDue ?? 0

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-card shadow-paper">
        <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
          <Link
            to="/"
            aria-label="VocabVault home"
            className="flex min-w-0 items-center gap-3 justify-self-start"
          >
            <Logo size={28} />
            <span
              data-testid="brand-wordmark"
              className="truncate font-display text-xl font-bold text-ink"
            >
              VocabVault
            </span>
          </Link>

          {user ? (
            <>
              <DesktopLinks totalDue={totalDue} />
              <div className="col-start-3 flex items-center gap-1.5 justify-self-end">
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
                className="text-sm font-medium text-ink-muted hover:text-ink"
              >
                Log in
              </Link>
              <Link to="/register" className="inline-flex">
                <Button>Register</Button>
              </Link>
            </div>
          )}
        </div>
      </header>
      {user && <MobileTabBar totalDue={totalDue} />}
    </>
  )
}
