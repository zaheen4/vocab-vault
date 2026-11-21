import { describe, expect, it } from 'vitest'
import { validateCredentials } from './auth.routes.js'

process.env.JWT_SECRET = 'auth-routes-test-secret'

describe('validateCredentials password byte length', () => {
  it('rejects passwords over 72 bytes on the register path', () => {
    expect(validateCredentials({ email: 'a@b.co', password: 'a'.repeat(73) })).toMatch(/72 bytes/)
  })

  it('allows passwords over 72 bytes on the login path', () => {
    expect(
      validateCredentials(
        { email: 'a@b.co', password: 'a'.repeat(73) },
        { enforceMinLength: false }
      )
    ).toBe(null)
  })

  it('still enforces the 128 character cap on the login path', () => {
    expect(
      validateCredentials(
        { email: 'a@b.co', password: 'a'.repeat(129) },
        { enforceMinLength: false }
      )
    ).toMatch(/128 characters/)
  })

  it('does not enforce the minimum length on the login path', () => {
    expect(
      validateCredentials({ email: 'a@b.co', password: 'short' }, { enforceMinLength: false })
    ).toBe(null)
  })

  it('enforces the minimum length on the register path', () => {
    expect(validateCredentials({ email: 'a@b.co', password: 'short' })).toMatch(/8 characters/)
  })
})
