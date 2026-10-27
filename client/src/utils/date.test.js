import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './date.js'

describe('formatRelativeTime', () => {
  const base = new Date('2026-10-27T12:00:00Z')

  it('returns empty string on null or invalid date', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
    expect(formatRelativeTime('invalid-date')).toBe('')
  })

  it('formats less than 60s as just now', () => {
    const d = new Date('2026-10-27T11:59:30Z')
    expect(formatRelativeTime(d, base)).toBe('just now')
  })

  it('formats minutes ago', () => {
    const d = new Date('2026-10-27T11:45:00Z')
    expect(formatRelativeTime(d, base)).toBe('15m ago')
  })

  it('formats hours ago', () => {
    const d = new Date('2026-10-27T08:00:00Z')
    expect(formatRelativeTime(d, base)).toBe('4h ago')
  })

  it('formats yesterday', () => {
    const d = new Date('2026-10-26T10:00:00Z')
    expect(formatRelativeTime(d, base)).toBe('yesterday')
  })

  it('formats days ago', () => {
    const d = new Date('2026-10-22T12:00:00Z')
    expect(formatRelativeTime(d, base)).toBe('5d ago')
  })

  it('formats dates older than 30 days with standard date format', () => {
    const d = new Date('2026-08-01T12:00:00Z')
    expect(formatRelativeTime(d, base)).toBe('Aug 1, 2026')
  })
})
