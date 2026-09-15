import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-page flex min-h-screen items-center justify-center bg-gold px-4 dark:bg-night-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none"
      >
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">Log in to VocabVault</h1>

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
          type="password"
          required
          autoComplete="current-password"
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          fullWidth
          loading={submitting}
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-cream-300/80">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
