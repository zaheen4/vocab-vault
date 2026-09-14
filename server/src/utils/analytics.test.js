import { describe, expect, it } from 'vitest'
import { pushHistory, recordActivity } from './analytics.js'

const noon = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0)

describe('recordActivity', () => {
  it('starts a first-day bucket', () => {
    const user = {}
    recordActivity(user, noon(2026, 9, 10))
    expect(user.activityLog).toHaveLength(1)
    expect(user.activityLog[0].reviews).toBe(1)
  })

  it('increments within the same day', () => {
    const user = { activityLog: [{ date: noon(2026, 9, 10), reviews: 3 }] }
    recordActivity(user, noon(2026, 9, 10))
    expect(user.activityLog).toHaveLength(1)
    expect(user.activityLog[0].reviews).toBe(4)
  })

  it('opens a new bucket when the day rolls over', () => {
    const user = { activityLog: [{ date: noon(2026, 9, 10), reviews: 5 }] }
    recordActivity(user, noon(2026, 9, 11))
    expect(user.activityLog).toHaveLength(2)
    expect(user.activityLog[1].reviews).toBe(1)
  })

  it('caps the log at 60 days', () => {
    const user = {
      activityLog: Array.from({ length: 60 }, (_, i) => ({
        date: noon(2026, 7, 1 + i),
        reviews: 1,
      })),
    }
    recordActivity(user, noon(2026, 9, 11))
    expect(user.activityLog).toHaveLength(60)
    expect(user.activityLog[59].reviews).toBe(1)
  })
})

describe('pushHistory', () => {
  it('appends newest-last and caps at 20', () => {
    const progress = {
      history: Array.from({ length: 20 }, (_, i) => ({
        at: noon(2026, 9, 1),
        correct: true,
        box: 2,
      })),
    }
    pushHistory(progress, { correct: false, box: 1 }, noon(2026, 9, 10))
    expect(progress.history).toHaveLength(20)
    expect(progress.history[19]).toMatchObject({ correct: false, box: 1 })
  })
})
