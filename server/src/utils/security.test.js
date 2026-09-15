import { describe, expect, it } from 'vitest'
import {
  escapeRegExp,
  isValidEmail,
  normalizeEmail,
  parsePagination,
  toSafeMessage,
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
