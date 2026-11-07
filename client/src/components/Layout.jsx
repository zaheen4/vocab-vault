import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink supports-[height:100dvh]:min-h-dvh">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-32 sm:px-6 sm:pt-6 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
