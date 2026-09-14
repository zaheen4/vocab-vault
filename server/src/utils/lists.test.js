import { describe, expect, it } from 'vitest'
import { validateListTitle } from './lists.js'

describe('validateListTitle', () => {
  it('accepts a normal title', () => {
    expect(validateListTitle('GRE words')).toBeNull()
  })

  it('rejects missing or blank titles', () => {
    expect(validateListTitle(undefined)).toBe('title is required')
    expect(validateListTitle('   ')).toBe('title is required')
  })

  it('rejects over-long titles', () => {
    expect(validateListTitle('x'.repeat(61))).toContain('at most 60')
  })
})
