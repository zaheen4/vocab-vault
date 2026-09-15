import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

// NOTE: no key={pathname} here on purpose — remounting <main> on every
// navigation destroys React reconciliation (all DOM, effects and fetches
// rerun). Pages that want an entrance transition use .animate-page on
// their own root instead.
export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-night-950">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 pb-6">
        <div className="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:gap-4 dark:border-white/10 dark:text-cream-300/60">
          <span className="font-display font-bold">VocabVault</span>
          <Link to="/privacy" className="inline-flex min-h-9 items-center px-1 hover:text-primary dark:hover:text-cream-100">
            Privacy
          </Link>
          <Link to="/contact" className="inline-flex min-h-9 items-center px-1 hover:text-primary dark:hover:text-cream-100">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  )
}
