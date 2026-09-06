import { describe, expect, it } from 'vitest'
import { BOX_INTERVALS, nextReviewState } from './leitner.js'

describe('nextReviewState', () => {
  it('advances the box on correct answers', () => {
    expect(nextReviewState({ box: 1, streakCorrect: 0 }, true).box).toBe(2)
    expect(nextReviewState({ box: 3, streakCorrect: 2 }, true).box).toBe(4)
  })

  it('caps the box at 5', () => {
    expect(nextReviewState({ box: 5, streakCorrect: 9 }, true).box).toBe(5)
  })

  it('resets to box 1 and clears the streak on wrong answers', () => {
    const s = nextReviewState({ box: 4, streakCorrect: 3 }, false)
    expect(s.box).toBe(1)
    expect(s.streakCorrect).toBe(0)
  })

  it('moves new words to learning on first review', () => {
    expect(nextReviewState({ box: 1 }, true).status).toBe('learning')
  })

  it('marks box 5 as mastered', () => {
    expect(nextReviewState({ box: 4 }, true).status).toBe('mastered')
  })

  it('schedules the next review per the resulting box interval', () => {
    const before = Date.now()
    const s = nextReviewState({ box: 2 }, true)
    expect(s.box).toBe(3) // correct advances first, interval follows the new box
    const dueIn = new Date(s.reviewDueAfter).getTime() - before
    expect(dueIn).toBeGreaterThan(0)
    expect(dueIn).toBeLessThanOrEqual(BOX_INTERVALS[s.box] * 86400000 + 5000)
  })
})
