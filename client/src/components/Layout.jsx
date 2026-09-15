import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
