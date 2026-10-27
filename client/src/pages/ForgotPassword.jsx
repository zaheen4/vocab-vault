import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../api/queries'
import AuthShell from '../components/AuthShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

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
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            <p className="font-semibold">Instructions dispatched</p>
            <p className="mt-1">{sentMessage}</p>
          </div>

          {devResetUrl && (
            <div className="rounded-lg border border-accent/40 bg-gold/30 p-3 text-xs dark:bg-accent/10">
              <span className="font-bold text-primary dark:text-cream-100">Local Dev Helper: </span>
              <a href={devResetUrl} className="font-semibold break-all text-accent underline hover:text-accent-deep">
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
          <p className="text-sm text-slate-500 dark:text-cream-300/80">
            Enter the email associated with your account, and we will send you a link to reset your password.
          </p>

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

          <Button
            type="submit"
            fullWidth
            loading={forgotMutation.isPending}
          >
            {forgotMutation.isPending ? 'Sending…' : 'Send reset link'}
          </Button>

          <p className="text-center text-sm text-slate-500 dark:text-cream-300/80">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
