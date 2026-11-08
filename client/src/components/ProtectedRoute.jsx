import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Mascot from './art/Mascot'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-ink-muted">
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
