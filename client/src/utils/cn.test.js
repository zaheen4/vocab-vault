import { describe, expect, it } from 'vitest'
import { cn } from './cn.js'

describe('cn', () => {
  it('joins truthy parts with spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('drops falsy parts (false, null, undefined, empty)', () => {
    expect(cn('a', false && 'b', null, undefined, '', 'c')).toBe('a c')
  })

  it('returns empty string for no truthy input', () => {
    expect(cn(false, null)).toBe('')
  })

  it('resolves conflicting Tailwind classes, later wins', () => {
    expect(cn('px-4 py-2 text-sm', 'px-3 py-1.5 text-xs')).toBe('px-3 py-1.5 text-xs')
  })
})
