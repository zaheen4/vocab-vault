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
