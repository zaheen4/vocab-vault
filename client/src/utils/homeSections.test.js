import { describe, expect, it } from 'vitest'
import {
  deckAction,
  deckTotals,
  filterDecksByStatus,
  goalProgress,
  nextDeckPart,
  pickContinueDeck,
} from './homeSections.js'

const deck = (over = {}) => ({
  _id: 'd1',
  title: 'Group 1',
  group: 1,
  wordCount: 30,
  dueCount: 0,
  progress: { new: 30, learning: 0, mastered: 0 },
  parts: [],
  ...over,
})

const started = (over = {}) =>
  deck({ progress: { new: 20, learning: 10, mastered: 0 }, ...over })

describe('deckTotals', () => {
  it('derives counts, mastery and start state', () => {
    expect(deckTotals(deck()).started).toBe(false)
    expect(deckTotals(started()).started).toBe(true)
    expect(
      deckTotals(deck({ progress: { new: 0, learning: 0, mastered: 30 } })).pct
    ).toBe(100)
  })

  it('separates practicable due from spaced-repetition review due', () => {
    expect(deckTotals(deck({ dueCount: 30 })).reviewDue).toBe(0)
    const totals = deckTotals(started({ dueCount: 26 }))
    expect(totals.due).toBe(26)
    expect(totals.reviewDue).toBe(6)
  })

  it('treats an empty deck as not complete', () => {
    const totals = deckTotals(deck({ wordCount: 0, progress: {} }))
    expect(totals.count).toBe(0)
    expect(totals.complete).toBe(false)
    expect(totals.pct).toBe(0)
  })

  it('aggregates per-part progress when the deck payload omits it', () => {
    const detail = {
      _id: 'd2',
      title: 'Group 2',
      parts: [
        { part: 1, wordCount: 10, dueCount: 7, progress: { new: 4, learning: 6, mastered: 0 } },
        { part: 2, wordCount: 10, dueCount: 10, progress: { new: 10, learning: 0, mastered: 0 } },
      ],
    }
    const totals = deckTotals(detail)
    expect(totals.count).toBe(20)
    expect(totals.seen).toBe(6)
    expect(totals.started).toBe(true)
    expect(totals.reviewDue).toBe(3)
  })

  it('falls back to wordIds when wordCount is missing', () => {
    const totals = deckTotals({ wordIds: ['a', 'b', 'c'], progress: { mastered: 1 } })
    expect(totals.count).toBe(3)
    expect(totals.pct).toBe(33)
  })
})

describe('filterDecksByStatus', () => {
  const list = [
    deck({ _id: 'new', group: 1, dueCount: 30 }),
    deck({ _id: 'started', group: 2, dueCount: 26, progress: { new: 24, learning: 6, mastered: 0 } }),
    deck({ _id: 'done', group: 3, dueCount: 0, progress: { new: 0, learning: 0, mastered: 30 } }),
  ]

  it('returns everything for all or an unknown status', () => {
    expect(filterDecksByStatus(list, 'all')).toHaveLength(3)
    expect(filterDecksByStatus(list, undefined)).toHaveLength(3)
  })

  it('splits untouched, started, due, and mastered decks', () => {
    expect(filterDecksByStatus(list, 'new').map((d) => d._id)).toEqual(['new'])
    expect(filterDecksByStatus(list, 'in-progress').map((d) => d._id)).toEqual(['started'])
    expect(filterDecksByStatus(list, 'due').map((d) => d._id)).toEqual(['started'])
    expect(filterDecksByStatus(list, 'mastered').map((d) => d._id)).toEqual(['done'])
  })

  it('does not list a fully mastered deck as in progress', () => {
    expect(filterDecksByStatus(list, 'in-progress').some((d) => d._id === 'done')).toBe(false)
  })
})

describe('pickContinueDeck', () => {
  it('prefers the first started deck with review due cards', () => {
    const list = [
      deck({ _id: 'a', group: 1, dueCount: 30 }),
      deck({ _id: 'b', group: 2, dueCount: 23, progress: { new: 20, learning: 5, mastered: 0 } }),
      deck({ _id: 'c', group: 3, dueCount: 30, progress: { new: 1, learning: 5, mastered: 0 } }),
    ]
    expect(pickContinueDeck(list)._id).toBe('b')
  })

  it('does not treat never-seen words as review due', () => {
    const list = [
      deck({ _id: 'a', group: 1, dueCount: 30 }),
      deck({ _id: 'b', group: 2, dueCount: 30, progress: { new: 25, learning: 5, mastered: 0 } }),
    ]
    expect(pickContinueDeck(list)._id).toBe('b')
  })

  it('falls back to a started deck without due cards, then the first deck', () => {
    expect(
      pickContinueDeck([
        deck({ _id: 'a', group: 1 }),
        deck({ _id: 'b', group: 2, progress: { new: 1, learning: 2, mastered: 0 } }),
      ])._id
    ).toBe('b')
    expect(
      pickContinueDeck([deck({ _id: 'a', group: 2 }), deck({ _id: 'b', group: 1 })])._id
    ).toBe('b')
  })

  it('returns null for an empty library', () => {
    expect(pickContinueDeck([])).toBeNull()
  })
})

describe('nextDeckPart', () => {
  it('returns null for single-part decks', () => {
    expect(nextDeckPart(deck())).toBeNull()
  })

  it('prefers a due part, then an unfinished part, then part 1', () => {
    const parts = [
      { part: 1, wordCount: 10, dueCount: 0, progress: { mastered: 10 } },
      { part: 2, wordCount: 10, dueCount: 4, progress: { mastered: 2 } },
      { part: 3, wordCount: 10, dueCount: 0, progress: { mastered: 0 } },
    ]
    expect(nextDeckPart(deck({ parts }))).toBe(2)
    expect(
      nextDeckPart(
        deck({
          parts: parts.map((p) =>
            p.part === 2 ? { ...p, dueCount: 0, progress: { mastered: 10 } } : { ...p, dueCount: 0 }
          ),
        })
      )
    ).toBe(3)
    expect(
      nextDeckPart(
        deck({
          parts: parts.map((p) => ({ ...p, dueCount: 0, progress: { mastered: 10 } })),
        })
      )
    ).toBe(1)
  })
})

describe('deckAction', () => {
  it('starts an untouched deck at its detail page', () => {
    expect(deckAction(deck())).toEqual({ label: 'Start deck →', to: '/decks/d1' })
  })

  it('sends a started multi-part deck straight to the next part', () => {
    const parts = [
      { part: 1, wordCount: 10, dueCount: 2, progress: { mastered: 0 } },
      { part: 2, wordCount: 10, dueCount: 0, progress: { mastered: 0 } },
    ]
    expect(deckAction(started({ parts }))).toEqual({
      label: 'Continue Part 1 →',
      to: '/decks/d1?part=1',
    })
  })

  it('labels a mastered deck as a review', () => {
    expect(
      deckAction(deck({ progress: { new: 0, learning: 0, mastered: 30 } })).label
    ).toBe('Review deck →')
  })

  it('returns null without an id', () => {
    expect(deckAction(null)).toBeNull()
  })
})

describe('goalProgress', () => {
  it('reports remaining reviews and a capped percentage', () => {
    expect(goalProgress(18, 25)).toEqual({
      reviews: 18,
      goal: 25,
      pct: 72,
      remaining: 7,
      met: false,
    })
    expect(goalProgress(30, 25)).toMatchObject({ pct: 100, remaining: 0, met: true })
  })

  it('never divides by zero', () => {
    expect(goalProgress(5, 0)).toMatchObject({ pct: 0, remaining: 0, met: false })
    expect(goalProgress(undefined, undefined)).toMatchObject({ reviews: 0, goal: 0 })
  })
})
