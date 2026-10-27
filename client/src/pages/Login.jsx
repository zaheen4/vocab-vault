import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password, rememberMe)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Log in to VocabVault">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">{error}</p>
        )}

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          labelRight={
            <Link to="/forgot-password" className="text-xs font-semibold text-accent hover:underline">
              Forgot password?
            </Link>
          }
          type="password"
          required
          autoComplete="current-password"
          maxLength={128}
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-700 dark:text-cream-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-accent focus:ring-accent dark:border-white/20 dark:bg-night-800"
            />
            Remember me
          </label>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={submitting}
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>

        {import.meta.env.DEV && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setEmail('qa@test.local')}
              className="text-xs text-slate-400 hover:text-accent dark:text-cream-300/60 dark:hover:text-cream-100"
            >
              Fill QA demo email (dev only)
            </button>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 dark:text-cream-300/80">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
