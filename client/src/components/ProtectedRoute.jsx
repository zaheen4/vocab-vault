import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  // Loading first: a stored token must validate against /auth/me before the
  // shell renders, otherwise a forged token string paints private routes.
  if (loading) {
    return (
      <div className="flex min-h-screen supports-[height:100dvh]:min-h-dvh items-center justify-center text-slate-500 dark:text-cream-300/70">
        Loading…
      </div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  return children
}
