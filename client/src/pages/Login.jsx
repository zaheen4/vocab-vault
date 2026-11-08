import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'
import Input from '../components/ui/Input'
import Notice from '../components/ui/Notice'

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
          <Notice tone="error">{error}</Notice>
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
            <Link to="/forgot-password" className="text-xs font-semibold text-accent-ink hover:underline">
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

        <div className="flex items-center justify-between">
          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
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
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              onClick={() => setEmail('qa@test.local')}
            >
              Fill QA demo email (dev only)
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-ink-muted">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-accent-ink hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
