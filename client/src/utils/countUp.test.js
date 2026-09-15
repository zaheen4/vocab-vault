import { describe, expect, it } from 'vitest'
import { easeOutCubic } from './countUp.js'

describe('easeOutCubic', () => {
  it('starts at 0 and lands exactly on 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('clamps outside input', () => {
    expect(easeOutCubic(-2)).toBe(0)
    expect(easeOutCubic(9)).toBe(1)
  })

  it('front-loads progress (fast start, gentle landing)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    const mid = easeOutCubic(0.5)
    expect(easeOutCubic(0.75) - mid).toBeLessThan(mid - easeOutCubic(0.25))
  })
})
