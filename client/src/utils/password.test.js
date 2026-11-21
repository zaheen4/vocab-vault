import { describe, expect, it } from 'vitest'
import { passwordByteLength, validatePassword } from './password.js'

describe('passwordByteLength', () => {
  it('counts bytes, not code points', () => {
    expect(passwordByteLength('')).toBe(0)
    expect(passwordByteLength('abc')).toBe(3)
    expect(passwordByteLength('é')).toBe(2)
  })
})

describe('validatePassword', () => {
  it('requires a non-empty string', () => {
    expect(validatePassword('')).toBe('Password is required')
    expect(validatePassword(null)).toBe('Password is required')
  })

  it('enforces the minimum length', () => {
    expect(validatePassword('short')).toContain('8 characters')
    expect(validatePassword('abcdefgh')).toBe(null)
  })

  it('enforces the maximum length before the byte cap', () => {
    // 129 ASCII chars trips the 128-character check before the 72-byte check.
    expect(validatePassword('a'.repeat(129))).toContain('128 characters')
    // 128 ASCII chars is within the character limit but over the 72-byte cap.
    expect(validatePassword('a'.repeat(128))).toContain('72 bytes')
  })

  it('enforces the 72-byte cap', () => {
    expect(validatePassword('a'.repeat(72))).toBe(null)
    expect(validatePassword('a'.repeat(73))).toContain('72 bytes')
    expect(validatePassword('é'.repeat(36))).toBe(null)
    expect(validatePassword('é'.repeat(37))).toContain('72 bytes')
  })
})
