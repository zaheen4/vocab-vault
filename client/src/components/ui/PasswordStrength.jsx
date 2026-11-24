import { useMemo } from 'react'
import { MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH, evaluatePassword } from '../../utils/password'

export default function PasswordStrength({ password = '' }) {
  const { score, lengthOk, varietyOk, bytesOk, bytes, label } = useMemo(
    () => evaluatePassword(password),
    [password]
  )

  if (!password) return null

  const colorClass = !bytesOk
    ? 'bg-stamp'
    : score === 1
      ? 'bg-stamp'
      : score === 2
        ? 'bg-brass'
        : 'bg-sage'
  const labelClass = !bytesOk || score === 1 ? 'text-stamp' : score === 2 ? 'text-ink' : 'text-sage'

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">Password strength</span>
        <span className={`font-semibold ${labelClass}`}>{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className={`h-1.5 rounded-full transition-colors ${score >= 1 ? colorClass : 'bg-line'}`} />
        <div className={`h-1.5 rounded-full transition-colors ${score >= 2 ? colorClass : 'bg-line'}`} />
        <div className={`h-1.5 rounded-full transition-colors ${score >= 3 ? colorClass : 'bg-line'}`} />
      </div>
      <ul className="space-y-0.5 text-xs text-ink-muted">
        <li className={lengthOk ? 'text-sage' : ''}>
          {lengthOk ? '✓' : '·'} At least {MIN_PASSWORD_LENGTH} characters
        </li>
        <li className={varietyOk ? 'text-sage' : ''}>
          {varietyOk ? '✓' : '·'} Mix of letters and numbers or symbols
        </li>
        <li className={bytesOk ? 'text-sage' : 'text-stamp'}>
          {bytesOk ? '✓' : '·'} At most {MAX_PASSWORD_BYTES} bytes
          {bytesOk ? '' : ` (${bytes}/${MAX_PASSWORD_BYTES})`}
        </li>
      </ul>
    </div>
  )
}
