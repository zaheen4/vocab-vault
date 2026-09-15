import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Mascot from './art/Mascot'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  // Loading first: a stored token must validate against /auth/me before the
  // shell renders, otherwise a forged token string paints private routes.
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500 dark:text-cream-300/70">
        <span className="animate-pop" aria-hidden="true">
          <Mascot size={56} />
        </span>
        Loading…
      </div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  return children
}
