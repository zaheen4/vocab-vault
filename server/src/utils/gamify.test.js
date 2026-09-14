import { describe, expect, it } from 'vitest'
import {
  applyDailyStreak,
  awardBadges,
  awardGoalRefill,
  BADGES,
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
    const user = {}
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(1)
    expect(result.streakIncreased).toBe(true)
    expect(result.freezeUsed).toBe(false)
  })

  it('is idempotent within the same day', () => {
    const user = { practiceStreakDays: 5, lastPracticeDate: noon(2026, 9, 6) }
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(5)
    expect(result.streakIncreased).toBe(false)
    expect(result.freezeUsed).toBe(false)
  })

  it('increments on consecutive days', () => {
    const user = { practiceStreakDays: 5, lastPracticeDate: noon(2026, 9, 5) }
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(6)
    expect(result.streakIncreased).toBe(true)
    expect(result.freezeUsed).toBe(false)
  })

  it('survives 1-day gap when freeze is available', () => {
    const user = { practiceStreakDays: 5, lastPracticeDate: noon(2026, 9, 4), streakFreezes: 1 }
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(6)
    expect(result.streakIncreased).toBe(true)
    expect(result.freezeUsed).toBe(true)
    expect(user.streakFreezes).toBe(0)
  })

  it('breaks streak on 2-day gap when no freeze is available', () => {
    const user = { practiceStreakDays: 12, lastPracticeDate: noon(2026, 9, 3), streakFreezes: 0 }
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(1)
    expect(result.streakIncreased).toBe(false)
    expect(result.freezeUsed).toBe(false)
  })

  it('breaks streak on 3+ day gap even with freeze', () => {
    const user = { practiceStreakDays: 8, lastPracticeDate: noon(2026, 9, 2), streakFreezes: 1 }
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(1)
    expect(result.freezeUsed).toBe(false)
    expect(user.streakFreezes).toBe(1)
  })

  it('does not double-consume freeze on same-day re-entry', () => {
    const user = { practiceStreakDays: 5, lastPracticeDate: noon(2026, 9, 4), streakFreezes: 1 }
    const first = applyDailyStreak(user, noon(2026, 9, 6))
    // simulate route writing back the result
    user.practiceStreakDays = first.dailyStreak
    user.lastPracticeDate = noon(2026, 9, 6)
    const result = applyDailyStreak(user, noon(2026, 9, 6))
    expect(result.dailyStreak).toBe(6)
    expect(result.streakIncreased).toBe(false)
    expect(result.freezeUsed).toBe(false)
    expect(user.streakFreezes).toBe(0)
  })
})

describe('awardGoalRefill', () => {
  it('awards freeze when reviews meet target', () => {
    const user = { reviewsToday: 10, dailyGoalTarget: 10, streakFreezes: 0 }
    const result = awardGoalRefill(user, noon(2026, 9, 10))
    expect(result.goalMet).toBe(true)
    expect(result.freezeRefilled).toBe(true)
    expect(user.streakFreezes).toBe(1)
    expect(user.goalsMet).toBe(1)
  })

  it('does not award when reviews are below target', () => {
    const user = { reviewsToday: 5, dailyGoalTarget: 10, streakFreezes: 0 }
    const result = awardGoalRefill(user, noon(2026, 9, 10))
    expect(result.goalMet).toBe(false)
    expect(result.freezeRefilled).toBe(false)
    expect(user.streakFreezes).toBe(0)
  })

  it('does not double-award on same day', () => {
    const user = { reviewsToday: 10, dailyGoalTarget: 10, streakFreezes: 0, goalsMet: 0 }
    awardGoalRefill(user, noon(2026, 9, 10))
    const result = awardGoalRefill(user, noon(2026, 9, 10))
    expect(result.goalMet).toBe(true)
    expect(result.freezeRefilled).toBe(false)
    expect(user.goalsMet).toBe(1)
  })

  it('awards again on the next day', () => {
    const user = { reviewsToday: 10, dailyGoalTarget: 10, streakFreezes: 0, goalsMet: 0 }
    awardGoalRefill(user, noon(2026, 9, 10))
    const result = awardGoalRefill(user, noon(2026, 9, 11))
    expect(result.goalMet).toBe(true)
    expect(result.freezeRefilled).toBe(true)
    expect(user.goalsMet).toBe(2)
  })
})

describe('awardBadges', () => {
  it('exposes the five documented badges', () => {
    expect(BADGES.map((b) => b.id)).toEqual([
      'first-word',
      'century',
      'week-warrior',
      'level-5',
      'flawless',
    ])
  })

  it('awards first-word on the first review', () => {
    const user = { totalReviewed: 1 }
    const fresh = awardBadges(user, noon(2026, 9, 10))
    expect(fresh.map((b) => b.id)).toEqual(['first-word'])
    expect(user.badges).toHaveLength(1)
  })

  it('awards nothing before any review', () => {
    const user = { totalReviewed: 0 }
    expect(awardBadges(user, noon(2026, 9, 10))).toEqual([])
    expect(user.badges || []).toHaveLength(0)
  })

  it('awards century, week-warrior, and level-5 at their thresholds', () => {
    const user = { totalReviewed: 100, practiceStreakDays: 7, level: 5 }
    const fresh = awardBadges(user, noon(2026, 9, 10))
    expect(fresh.map((b) => b.id).sort()).toEqual(
      ['century', 'first-word', 'level-5', 'week-warrior'].sort()
    )
  })

  it('awards flawless at a 10-answer correct run', () => {
    const user = { totalReviewed: 10, perfectRun: 10 }
    const fresh = awardBadges(user, noon(2026, 9, 10))
    expect(fresh.map((b) => b.id)).toContain('flawless')
  })

  it('does not award flawless below the run target', () => {
    const user = { totalReviewed: 9, perfectRun: 9 }
    const fresh = awardBadges(user, noon(2026, 9, 10))
    expect(fresh.map((b) => b.id)).not.toContain('flawless')
  })

  it('never re-awards an already-earned badge', () => {
    const user = {
      totalReviewed: 200,
      practiceStreakDays: 30,
      level: 9,
      perfectRun: 40,
      badges: [{ id: 'first-word', awardedAt: noon(2026, 9, 1) }],
    }
    const fresh = awardBadges(user, noon(2026, 9, 10))
    expect(fresh.map((b) => b.id)).not.toContain('first-word')
    expect(user.badges.filter((b) => b.id === 'first-word')).toHaveLength(1)
  })
})
