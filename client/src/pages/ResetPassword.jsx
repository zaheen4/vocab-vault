import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useResetPassword } from '../api/queries'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Notice from '../components/ui/Notice'
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
          <Notice tone="error">
            This password reset link is missing a token or is invalid.
          </Notice>
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
          <Notice tone="success" title="Password updated!">
            <p>{success} Redirecting to login…</p>
          </Notice>
          <Link to="/login">
            <Button fullWidth>Continue to login</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Enter your new password below.
          </p>

          {error && (
            <Notice tone="error">{error}</Notice>
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

          <p className="text-center text-sm text-ink-muted">
            <Link to="/login" className="font-medium text-accent-ink hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
