import { describe, expect, it } from 'vitest'
import { CELEBRATE_MIN_PCT, sessionPct, shouldCelebrate } from './celebrate.js'

describe('sessionPct', () => {
  it('returns 0 for empty sessions', () => {
    expect(sessionPct(0, 0)).toBe(0)
  })

  it('rounds normally', () => {
    expect(sessionPct(7, 10)).toBe(70)
  })
})

describe('shouldCelebrate', () => {
  it(`fires at or above ${CELEBRATE_MIN_PCT}%`, () => {
    expect(shouldCelebrate({ correct: 6, total: 10 })).toBe(true)
    expect(shouldCelebrate({ correct: 5, total: 10 })).toBe(false)
  })

  it('never fires on a shutout without a level-up', () => {
    expect(shouldCelebrate({ correct: 0, total: 8 })).toBe(false)
  })

  it('always fires on level-up', () => {
    expect(shouldCelebrate({ correct: 0, total: 8, levelUp: true })).toBe(true)
  })
})
