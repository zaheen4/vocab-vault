export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128
export const MAX_PASSWORD_BYTES = 72

export function passwordByteLength(value) {
  return new TextEncoder().encode(typeof value === 'string' ? value : '').length
}

export function validatePassword(value) {
  if (typeof value !== 'string' || !value) return 'Password is required'
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
  }
  if (passwordByteLength(value) > MAX_PASSWORD_BYTES) {
    return `Password must be at most ${MAX_PASSWORD_BYTES} bytes`
  }
  return null
}

export function evaluatePassword(value = '') {
  const lengthOk = value.length >= MIN_PASSWORD_LENGTH
  const hasLetter = /[a-zA-Z]/.test(value)
  const hasNumberOrSymbol = /[\d\W_]/.test(value)
  const bytes = passwordByteLength(value)
  const bytesOk = bytes <= MAX_PASSWORD_BYTES

  let score = 0
  if (value.length > 0) score = 1
  if (lengthOk) score = 2
  if (lengthOk && hasLetter && hasNumberOrSymbol) score = 3

  return {
    score: bytesOk ? score : Math.min(score, 2),
    lengthOk,
    varietyOk: hasLetter && hasNumberOrSymbol,
    bytesOk,
    bytes,
    label: strengthLabel(score, bytesOk),
  }
}

function strengthLabel(score, bytesOk) {
  if (!bytesOk) return 'Too long'
  if (score <= 0) return ''
  if (score === 1) return 'Weak'
  if (score === 2) return 'Fair'
  return 'Strong'
}
