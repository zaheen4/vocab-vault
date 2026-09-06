import { describe, expect, it } from 'vitest'
import { isCorrectSpelling, levenshtein, normalizeAnswer, toleranceFor } from './fuzzyMatch.js'

describe('normalizeAnswer', () => {
  it('lowercases, trims and strips punctuation', () => {
    expect(normalizeAnswer('  Aberration! ')).toBe('aberration')
    expect(normalizeAnswer('mother-in-law')).toBe('motherinlaw')
  })

  it('handles empty input', () => {
    expect(normalizeAnswer('')).toBe('')
    expect(normalizeAnswer(null)).toBe('')
  })
})

describe('levenshtein', () => {
  it('measures edit distance', () => {
    expect(levenshtein('cat', 'cat')).toBe(0)
    expect(levenshtein('cat', 'cut')).toBe(1)
    expect(levenshtein('cat', 'cuts')).toBe(2)
    expect(levenshtein('', 'abc')).toBe(3)
  })
})

describe('isCorrectSpelling', () => {
  it('accepts exact, case and punctuation variants', () => {
    expect(isCorrectSpelling('aberration', 'aberration')).toBe(true)
    expect(isCorrectSpelling('aberration', 'Aberration')).toBe(true)
    expect(isCorrectSpelling('aberration', ' aberration! ')).toBe(true)
  })

  it('accepts small typos within tolerance', () => {
    expect(toleranceFor('aberration')).toBe(2) // len 10
    expect(isCorrectSpelling('aberration', 'aberation')).toBe(true) // missing t
    expect(isCorrectSpelling('aberration', 'aberratoin')).toBe(true) // transposition-ish (2 edits)
  })

  it('rejects far misses and short-word typos beyond tolerance', () => {
    expect(toleranceFor('cat')).toBe(1) // len 3
    expect(isCorrectSpelling('cat', 'cut')).toBe(true) // 1 edit, tolerated
    expect(isCorrectSpelling('cat', 'dog')).toBe(false)
    expect(isCorrectSpelling('aberration', 'banana')).toBe(false)
  })

  it('rejects empty answers', () => {
    expect(isCorrectSpelling('aberration', '')).toBe(false)
    expect(isCorrectSpelling('aberration', '   ')).toBe(false)
  })
})
