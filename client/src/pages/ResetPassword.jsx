import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useResetPassword } from '../api/queries'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PasswordStrength from '../components/ui/PasswordStrength'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const resetMutation = useResetPassword()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token) {
      setError('Missing reset token. Please request a new link.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password.length > 128) {
      setError('Password must be at most 128 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    try {
      const data = await resetMutation.mutateAsync({ token, password })
      setSuccess(data.message || 'Password reset successful.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid Reset Link">
        <div className="space-y-4 text-center">
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
            This password reset link is missing a token or is invalid.
          </p>
          <Link to="/forgot-password">
            <Button fullWidth>Request new reset link</Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set new password">
      {success ? (
        <div className="space-y-4 text-center">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            <p className="font-semibold">Password updated!</p>
            <p className="mt-1">{success} Redirecting to login…</p>
          </div>
          <Link to="/login">
            <Button fullWidth>Continue to login</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-cream-300/80">
            Enter your new password below.
          </p>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">{error}</p>
          )}

          <div>
            <Input
              label="New password"
              type="password"
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              showPasswordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrength password={password} />
          </div>

          <Input
            label="Confirm new password"
            type="password"
            required
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            showPasswordToggle
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            loading={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Updating…' : 'Reset password'}
          </Button>

          <p className="text-center text-sm text-slate-500 dark:text-cream-300/80">
            <Link to="/login" className="font-medium text-accent hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
