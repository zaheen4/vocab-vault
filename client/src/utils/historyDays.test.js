import { describe, expect, it } from 'vitest'
import { dayLabel, groupByDay } from './historyDays'

// Local noon so the day never shifts under a different timezone.
const NOW = new Date(2026, 10, 6, 12)
const at = (year, month, day, hour = 12) => new Date(year, month, day, hour)

describe('dayLabel', () => {
  it('names today and yesterday instead of a date', () => {
    expect(dayLabel('2026-11-06', NOW)).toBe('Today')
    expect(dayLabel('2026-11-05', NOW)).toBe('Yesterday')
  })

  it('falls back to a short weekday and date', () => {
    expect(dayLabel('2026-11-03', NOW)).toMatch(/Nov\s*3/)
  })

  it('survives a missing key', () => {
    expect(dayLabel('', NOW)).toBe('')
  })
})

describe('groupByDay', () => {
  it('groups entries by their local calendar day, newest group first', () => {
    const groups = groupByDay(
      [
        { id: 1, at: at(2026, 10, 6, 18) },
        { id: 2, at: at(2026, 10, 6, 9) },
        { id: 3, at: at(2026, 10, 5, 20) },
      ],
      (item) => item.at,
      NOW
    )
    expect(groups.map((g) => g.key)).toEqual(['2026-11-06', '2026-11-05'])
    expect(groups[0].items.map((i) => i.id)).toEqual([1, 2])
    expect(groups[0].label).toBe('Today')
    expect(groups[1].label).toBe('Yesterday')
  })

  it('accepts ISO strings, which is what the API returns', () => {
    const groups = groupByDay([{ id: 1, at: at(2026, 10, 6).toISOString() }], (item) => item.at, NOW)
    expect(groups).toHaveLength(1)
    expect(groups[0].items).toHaveLength(1)
  })

  it('drops entries with no usable date instead of inventing a group', () => {
    const groups = groupByDay(
      [
        { id: 1, at: null },
        { id: 2, at: 'not-a-date' },
        { id: 3, at: at(2026, 10, 4) },
      ],
      (item) => item.at,
      NOW
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].items.map((i) => i.id)).toEqual([3])
  })

  it('returns no groups for an empty feed', () => {
    expect(groupByDay([], (item) => item.at, NOW)).toEqual([])
  })
})
