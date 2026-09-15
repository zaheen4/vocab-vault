import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password.length > 128) {
      setError('Password must be at most 128 characters')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await register(name, email, password)
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
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow dark:border dark:border-white/10 dark:bg-night-900 dark:shadow-none"
      >
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">Create your account</h1>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">{error}</p>
        )}

        <Input
          label="Name"
          type="text"
          required
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            label="Password"
            type="password"
            required
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="mt-1 block text-xs text-slate-400 dark:text-cream-300/60">At least 6 characters</span>
        </div>

        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-cream-300/80">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
