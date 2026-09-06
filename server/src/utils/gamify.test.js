import { describe, expect, it } from 'vitest'
import {
  applyDailyStreak,
  levelFor,
  xpForAnswer,
  xpForLevel,
  xpProgress,
} from './gamify.js'

const noon = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0)

describe('xpForAnswer', () => {
  it('rewards wrong answers with a consolation 3 XP', () => {
    expect(xpForAnswer(false)).toBe(3)
    expect(xpForAnswer(false, 5)).toBe(3)
  })

  it('scales correct answers by box: 10 + box*2', () => {
    expect(xpForAnswer(true, 1)).toBe(12)
    expect(xpForAnswer(true, 2)).toBe(14)
    expect(xpForAnswer(true, 5)).toBe(20)
  })
})

describe('level curve (sqrt, base 100)', () => {
  it('starts at level 1 and thresholds at squares of 100', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(99)).toBe(1)
    expect(levelFor(100)).toBe(2)
    expect(levelFor(399)).toBe(2)
    expect(levelFor(400)).toBe(3)
  })

  it('xpForLevel inverts levelFor at thresholds', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(xpForLevel(3)).toBe(400)
  })

  it('xpProgress reports span position within the level', () => {
    const p = xpProgress(2, 250)
    expect(p.current).toBe(100)
    expect(p.next).toBe(400)
    expect(p.progress).toBeCloseTo(0.5)
  })
})

describe('applyDailyStreak', () => {
  it('starts at 1 for first-ever practice', () => {
    expect(applyDailyStreak({}, noon(2026, 9, 6))).toEqual({ dailyStreak: 1, streakIncreased: true })
  })

  it('is idempotent within the same day', () => {
    const user = { practiceStreakDays: 5, lastPracticeDate: noon(2026, 9, 6) }
    expect(applyDailyStreak(user, new Date(2026, 8, 6, 20, 0, 0))).toEqual({
      dailyStreak: 5,
      streakIncreased: false,
    })
  })

  it('increments on consecutive days', () => {
    const user = { practiceStreakDays: 5, lastPracticeDate: noon(2026, 9, 5) }
    expect(applyDailyStreak(user, noon(2026, 9, 6))).toEqual({
      dailyStreak: 6,
      streakIncreased: true,
    })
  })

  it('resets to 1 after a 2+ day gap', () => {
    const user = { practiceStreakDays: 12, lastPracticeDate: noon(2026, 9, 3) }
    expect(applyDailyStreak(user, noon(2026, 9, 6))).toEqual({
      dailyStreak: 1,
      streakIncreased: true,
    })
  })
})
