import { useMemo } from 'react'

export function evaluatePassword(pwd = '') {
  const lengthOk = pwd.length >= 8
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasNumberOrSymbol = /[\d\W_]/.test(pwd)

  let score = 0
  if (pwd.length >= 6) score = 1
  if (lengthOk && (hasLetter || hasNumberOrSymbol)) score = 2
  if (lengthOk && hasLetter && hasNumberOrSymbol) score = 3

  return {
    score,
    lengthOk,
    varietyOk: hasLetter && hasNumberOrSymbol,
    label: score === 0 ? '' : score === 1 ? 'Weak' : score === 2 ? 'Fair' : 'Strong',
  }
}

export default function PasswordStrength({ password = '' }) {
  const { score, lengthOk, varietyOk, label } = useMemo(() => evaluatePassword(password), [password])

  if (!password) return null

  const colorClass =
    score === 1
      ? 'bg-red-500'
      : score === 2
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-cream-300/70">Password strength</span>
        <span
          className={`font-semibold ${
            score === 1
              ? 'text-red-600 dark:text-red-400'
              : score === 2
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className={`h-1.5 rounded-full transition-colors ${score >= 1 ? colorClass : 'bg-slate-200 dark:bg-night-800'}`} />
        <div className={`h-1.5 rounded-full transition-colors ${score >= 2 ? colorClass : 'bg-slate-200 dark:bg-night-800'}`} />
        <div className={`h-1.5 rounded-full transition-colors ${score >= 3 ? colorClass : 'bg-slate-200 dark:bg-night-800'}`} />
      </div>
      <ul className="space-y-0.5 text-xs text-slate-500 dark:text-cream-300/70">
        <li className={lengthOk ? 'text-emerald-600 dark:text-emerald-400' : ''}>
          {lengthOk ? '✓' : '·'} At least 8 characters
        </li>
        <li className={varietyOk ? 'text-emerald-600 dark:text-emerald-400' : ''}>
          {varietyOk ? '✓' : '·'} Mix of letters and numbers or symbols
        </li>
      </ul>
    </div>
  )
}
