import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main key={location.pathname} className="animate-page mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
