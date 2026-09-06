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
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
