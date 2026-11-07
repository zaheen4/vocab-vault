import { describe, expect, it } from 'vitest'
import { weekDays, weekLevel, weekTotal } from './weekActivity'

const NOW = new Date(2026, 10, 6, 12)

describe('weekDays', () => {
  it('always returns seven days, oldest first, ending today', () => {
    const days = weekDays([], NOW)
    expect(days).toHaveLength(7)
    expect(days[0].key).toBe('2026-10-31')
    expect(days[6].key).toBe('2026-11-06')
    expect(days.filter((d) => d.isToday)).toEqual([days[6]])
  })

  it('treats a missing day as a real zero', () => {
    const days = weekDays([], NOW)
    expect(days.map((d) => d.reviews)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('maps review counts by calendar key and ignores out-of-window days', () => {
    const days = weekDays(
      [
        { date: '2026-11-06', reviews: 4 },
        { date: '2026-11-04', reviews: 2 },
        { date: '2026-10-01', reviews: 99 },
      ],
      NOW
    )
    expect(days.find((d) => d.key === '2026-11-06').reviews).toBe(4)
    expect(days.find((d) => d.key === '2026-11-04').reviews).toBe(2)
    expect(weekTotal(days)).toBe(6)
  })

  it('carries the weekday letter for each cell', () => {
    const days = weekDays([], NOW)
    expect(days.map((d) => d.letter)).toEqual(['S', 'S', 'M', 'T', 'W', 'T', 'F'])
  })
})

describe('weekLevel', () => {
  it('keeps empty days at zero', () => {
    expect(weekLevel(0, 10)).toBe(0)
  })

  it('scales against the busiest day in the week', () => {
    expect(weekLevel(2, 10)).toBe(1)
    expect(weekLevel(5, 10)).toBe(2)
    expect(weekLevel(10, 10)).toBe(3)
  })

  it('never divides by zero on an empty week', () => {
    expect(weekLevel(1, 0)).toBe(3)
  })
})
