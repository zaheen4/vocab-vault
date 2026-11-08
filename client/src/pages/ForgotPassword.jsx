import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../api/queries'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Notice from '../components/ui/Notice'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')
  const [error, setError] = useState('')
  const forgotMutation = useForgotPassword()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSentMessage('')
    setDevResetUrl('')

    try {
      const data = await forgotMutation.mutateAsync({ email })
      setSentMessage(data.message || 'If that email is registered, password reset instructions have been sent.')
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthShell title="Reset your password">
      {sentMessage ? (
        <div className="space-y-4">
          <Notice tone="success" title="Instructions dispatched">
            <p>{sentMessage}</p>
          </Notice>

          {devResetUrl && (
            <div className="rounded-lg border border-accent/40 bg-gold/30 p-3 text-xs dark:bg-accent/10">
              <span className="font-bold text-ink">Local Dev Helper: </span>
              <a href={devResetUrl} className="font-semibold break-all text-accent-ink underline hover:underline">
                Click here to test password reset
              </a>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link to="/login">
              <Button variant="secondary" fullWidth>
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Enter the email associated with your account, and we will send you a link to reset your password.
          </p>

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

          <Button
            type="submit"
            fullWidth
            loading={forgotMutation.isPending}
          >
            {forgotMutation.isPending ? 'Sending…' : 'Send reset link'}
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-accent-ink hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
