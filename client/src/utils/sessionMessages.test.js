import { describe, expect, it } from 'vitest'
import { COMBO_THRESHOLD, POOLS, createMemoryStore, getSessionMessage, pickPool } from './sessionMessages.js'

describe('pickPool boundaries', () => {
  const cases = [
    [{ pct: 100 }, 'perfect'],
    [{ pct: 90, levelUp: true }, 'levelup'],
    [{ pct: 30, levelUp: true }, 'levelup'],
    [{ pct: 70, bestCombo: 9 }, 'combo'],
    [{ pct: 70, bestCombo: 7 }, 'good'],
    [{ pct: 80 }, 'excellent'],
    [{ pct: 79 }, 'good'],
    [{ pct: 60 }, 'good'],
    [{ pct: 59 }, 'encouraging'],
    [{ pct: 40 }, 'encouraging'],
    [{ pct: 39 }, 'comeback'],
    [{ pct: 0 }, 'comeback'],
  ]
  for (const [ctx, expected] of cases) {
    it(`${JSON.stringify(ctx)} -> ${expected}`, () => {
      expect(pickPool(ctx)).toBe(expected)
    })
  }

  it(`combo threshold is ${COMBO_THRESHOLD}`, () => {
    expect(pickPool({ pct: 70, bestCombo: COMBO_THRESHOLD })).toBe('combo')
  })
})

describe('round-robin rotation', () => {
  const ctxFor = {
    perfect: { correct: 10, total: 10 },
    levelup: { correct: 7, total: 10, levelUp: true, level: 5 },
    combo: { correct: 9, total: 10, bestCombo: 9 },
    excellent: { correct: 8, total: 10 },
    good: { correct: 6, total: 10 },
    encouraging: { correct: 4, total: 10 },
    comeback: { correct: 1, total: 10 },
  }

  for (const [name, pool] of Object.entries(POOLS)) {
    it(`${name}: full cycle without repeats, then wraps`, () => {
      const store = createMemoryStore()
      const seen = []
      for (let i = 0; i < pool.length; i++) seen.push(getSessionMessage(ctxFor[name], store))
      expect(new Set(seen).size).toBe(pool.length)
      expect(getSessionMessage(ctxFor[name], store)).toBe(seen[0])
    })
  }

  it('resolves dynamic level and streak variants', () => {
    const m = getSessionMessage({ correct: 9, total: 10, bestCombo: 9 }, createMemoryStore())
    expect(typeof m).toBe('string')
    expect(m.length).toBeGreaterThan(0)
  })

  it('is safe on empty sessions', () => {
    expect(typeof getSessionMessage({ correct: 0, total: 0 }, createMemoryStore())).toBe('string')
  })
})
