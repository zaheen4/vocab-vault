import { describe, expect, it } from 'vitest'
import {
  escapeRegExp,
  isValidEmail,
  normalizeEmail,
  parsePagination,
  passwordByteLength,
  resolveClientOrigin,
  toSafeMessage,
  validateNewPassword,
} from './security.js'

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Example.COM ')).toBe('foo@example.com')
  })

  it('returns empty string for non-strings', () => {
    expect(normalizeEmail(undefined)).toBe('')
    expect(normalizeEmail({})).toBe('')
  })
})

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('qa@test.local')).toBe(true)
  })

  it('rejects operator-injection objects and bad shapes', () => {
    expect(isValidEmail({ $gt: '' })).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail(`a@${'x'.repeat(250)}.com`)).toBe(false)
  })
})

describe('passwordByteLength', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(passwordByteLength('')).toBe(0)
    expect(passwordByteLength('abc')).toBe(3)
    expect(passwordByteLength('é')).toBe(2)
  })
})

describe('validateNewPassword', () => {
  it('rejects a missing or empty password', () => {
    expect(validateNewPassword('')).toBe('Password is required')
    expect(validateNewPassword(undefined)).toBe('Password is required')
  })

  it('enforces the minimum length', () => {
    expect(validateNewPassword('short')).toMatch(/8 characters/)
    expect(validateNewPassword('abcdefgh')).toBe(null)
  })

  it('allows up to 72 ASCII bytes and rejects more', () => {
    expect(validateNewPassword('a'.repeat(72))).toBe(null)
    expect(validateNewPassword('a'.repeat(73))).toMatch(/72 bytes/)
  })

  it('enforces the 128 character cap', () => {
    expect(validateNewPassword('a'.repeat(129))).toMatch(/128 characters/)
  })

  it('enforces the byte cap on multi-byte characters', () => {
    expect(validateNewPassword('é'.repeat(36))).toBe(null)
    expect(validateNewPassword('é'.repeat(37))).toMatch(/72 bytes/)
  })
})

describe('escapeRegExp', () => {
  it('neutralizes regex meta-characters', () => {
    expect(escapeRegExp('(a+)+$')).toBe('\\(a\\+\\)\\+\\$')
    expect(new RegExp(escapeRegExp('(a+)+$')).test('(a+)+$')).toBe(true)
  })
})

describe('parsePagination', () => {
  it('clamps absurd limits and bad pages', () => {
    expect(parsePagination({ page: 'abc', limit: '1000000' })).toEqual({ page: 1, limit: 100 })
    expect(parsePagination({ page: '-3', limit: '0' })).toEqual({ page: 1, limit: 1 })
    expect(parsePagination({})).toEqual({ page: 1, limit: 20 })
  })
})

describe('resolveClientOrigin', () => {
  it('returns null in production without configuration', () => {
    expect(resolveClientOrigin({ NODE_ENV: 'production' })).toBe(null)
    expect(resolveClientOrigin({ NODE_ENV: 'production', CLIENT_URL: '   ' })).toBe(null)
  })

  it('uses localhost outside production when nothing is configured', () => {
    expect(resolveClientOrigin({})).toBe('http://localhost:5173')
    expect(resolveClientOrigin({ NODE_ENV: 'development' })).toBe('http://localhost:5173')
  })

  it('uses CLIENT_URL as the primary origin', () => {
    expect(
      resolveClientOrigin({
        NODE_ENV: 'production',
        CLIENT_URL: 'https://vvault.pages.dev',
      })
    ).toBe('https://vvault.pages.dev')
  })

  it('prefers CLIENT_URL over ALLOWED_ORIGINS extras', () => {
    expect(
      resolveClientOrigin({
        NODE_ENV: 'production',
        CLIENT_URL: 'https://primary.example',
        ALLOWED_ORIGINS: 'https://extra-a.example,https://extra-b.example',
      })
    ).toBe('https://primary.example')
  })

  it('uses the first ALLOWED_ORIGINS extra when CLIENT_URL is absent', () => {
    expect(
      resolveClientOrigin({
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: 'https://extra-a.example,https://extra-b.example',
      })
    ).toBe('https://extra-a.example')
  })

  it('trims whitespace and trailing slashes', () => {
    expect(
      resolveClientOrigin({
        NODE_ENV: 'production',
        CLIENT_URL: '  https://app.example.com///  ',
      })
    ).toBe('https://app.example.com')
    expect(
      resolveClientOrigin({
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: '  https://one.example///  ,  https://two.example  ',
      })
    ).toBe('https://one.example')
  })
})

describe('toSafeMessage', () => {
  it('passes operational messages, hides internals', () => {
    const op = new Error('Validation failed')
    op.status = 400
    expect(toSafeMessage(op)).toBe('Validation failed')
    expect(toSafeMessage({ name: 'CastError' })).toBe('Invalid id')
    expect(toSafeMessage({ code: 11000 })).toBe('Already exists')
    expect(toSafeMessage(new Error('E11000 duplicate key { email: "x" }'))).toBe('Server error')
  })
})
