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
})
