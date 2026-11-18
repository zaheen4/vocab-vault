import { describe, expect, it } from 'vitest'
import { buildActivityUpdate, needsReviewsTodayReset, reviewDayKey } from './progress.routes.js'

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0)

describe('reviewDayKey', () => {
  it('builds a UTC key from local calendar parts', () => {
    expect(reviewDayKey(at(2026, 9, 6))).toBe(Date.UTC(2026, 8, 6))
  })
})

describe('needsReviewsTodayReset', () => {
  it('resets when there is no prior review date', () => {
    expect(needsReviewsTodayReset(undefined, at(2026, 9, 6))).toBe(true)
  })

  it('does not reset within the same calendar day', () => {
    expect(needsReviewsTodayReset(at(2026, 9, 5, 8), at(2026, 9, 5, 20))).toBe(false)
  })

  it('resets on the next calendar day', () => {
    expect(needsReviewsTodayReset(at(2026, 9, 5, 23), at(2026, 9, 6, 1))).toBe(true)
  })
})

describe('buildActivityUpdate', () => {
  it('increments the existing bucket on a same-day review', () => {
    const day = new Date(2026, 8, 10)
    const result = buildActivityUpdate([{ date: day, reviews: 3 }], at(2026, 9, 10, 20))
    expect(result.inc).toEqual({ 'activityLog.$[day].reviews': 1 })
    expect(result.arrayFilters).toEqual([{ 'day.date': day }])
    expect(result.push).toBeUndefined()
  })

  it('pushes a capped day bucket on the first review of a day', () => {
    const today = at(2026, 9, 11)
    const result = buildActivityUpdate([{ date: at(2026, 9, 10), reviews: 3 }], today)
    expect(result.push.activityLog.$each).toEqual([
      { date: new Date(2026, 8, 11), reviews: 1 },
    ])
    expect(result.push.activityLog.$slice).toBe(-60)
    expect(result.inc).toBeUndefined()
  })

  it('starts a bucket when the log is empty', () => {
    const result = buildActivityUpdate([], at(2026, 9, 11))
    expect(result.push.activityLog.$each).toHaveLength(1)
    expect(result.arrayFilters).toBeUndefined()
  })
})
