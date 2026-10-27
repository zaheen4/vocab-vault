import { describe, expect, it } from 'vitest'
import { countDeckDue, summarizeDeckParts, summarizeDeckProgress } from './decks.js'

describe('summarizeDeckProgress', () => {
  it('counts reviewed words by status per deck', () => {
    const decks = [
      { _id: 'd1', wordIds: ['w1', 'w2', 'w3'] },
      { _id: 'd2', wordIds: ['w2', 'w4'] },
    ]
    const byWord = new Map([
      ['w1', 'mastered'],
      ['w2', 'learning'],
    ])
    expect(summarizeDeckProgress(decks, byWord)).toEqual([
      { deckId: 'd1', progress: { new: 1, learning: 1, mastered: 1 } },
      { deckId: 'd2', progress: { new: 1, learning: 1, mastered: 0 } },
    ])
  })

  it('treats unknown statuses and missing records as new', () => {
    const decks = [{ _id: 'd1', wordIds: ['w1', 'w2'] }]
    const byWord = new Map([['w1', 'archived']])
    expect(summarizeDeckProgress(decks, byWord)).toEqual([
      { deckId: 'd1', progress: { new: 2, learning: 0, mastered: 0 } },
    ])
  })

  it('handles object ids and empty decks', () => {
    const oid = { _id: 'w9', toString: () => 'w9' }
    expect(
      summarizeDeckProgress(
        [
          { _id: 'd1', wordIds: [oid] },
          { _id: 'd2', wordIds: [] },
        ],
        new Map([['w9', 'mastered']])
      )
    ).toEqual([
      { deckId: 'd1', progress: { new: 0, learning: 0, mastered: 1 } },
      { deckId: 'd2', progress: { new: 0, learning: 0, mastered: 0 } },
    ])
  })
})

describe('countDeckDue', () => {
  const now = new Date('2026-09-15T12:00:00Z')
  const past = new Date('2026-09-10T12:00:00Z')
  const future = new Date('2026-09-20T12:00:00Z')

  it('counts unseen plus due words, skips seen-but-not-due', () => {
    const decks = [{ _id: 'd1', wordIds: ['w1', 'w2', 'w3', 'w4'] }]
    const detail = new Map([
      ['w1', { status: 'learning', reviewDueAfter: past }],
      ['w2', { status: 'learning', reviewDueAfter: future }],
      ['w3', { status: 'mastered', reviewDueAfter: null }],
    ])
    // w1 due, w2 not due, w3 due (no date), w4 unseen
    expect(countDeckDue(decks, detail, now)).toEqual([{ deckId: 'd1', dueCount: 3 }])
  })

  it('returns zero for fully scheduled and empty decks', () => {
    const decks = [
      { _id: 'd1', wordIds: ['w1'] },
      { _id: 'd2', wordIds: [] },
    ]
    const detail = new Map([['w1', { status: 'mastered', reviewDueAfter: future }]])
    expect(countDeckDue(decks, detail, now)).toEqual([
      { deckId: 'd1', dueCount: 0 },
      { deckId: 'd2', dueCount: 0 },
    ])
  })
})

describe('summarizeDeckParts', () => {
  const now = new Date('2026-09-15T12:00:00Z')

  it('returns empty array for decks with 10 or fewer words', () => {
    const deck = { wordIds: ['w1', 'w2'] }
    expect(summarizeDeckParts(deck, new Map(), new Map(), now)).toEqual([])
  })

  it('slices a 30-word deck into 3 parts with independent progress and due counts', () => {
    const wordIds = Array.from({ length: 30 }, (_, i) => `w${i + 1}`)
    const deck = { wordIds }
    const progress = new Map([
      ['w1', 'mastered'],
      ['w11', 'learning'],
      ['w21', 'mastered'],
    ])
    const detail = new Map([
      ['w1', { status: 'mastered', reviewDueAfter: new Date('2026-09-20T00:00:00Z') }], // not due
      ['w11', { status: 'learning', reviewDueAfter: new Date('2026-09-10T00:00:00Z') }], // due
    ])

    const parts = summarizeDeckParts(deck, progress, detail, now)
    expect(parts).toHaveLength(3)
    expect(parts[0]).toEqual({
      part: 1,
      wordCount: 10,
      progress: { new: 9, learning: 0, mastered: 1 },
      dueCount: 9, // 9 unseen + 0 due (w1 is not due)
    })
    expect(parts[1]).toEqual({
      part: 2,
      wordCount: 10,
      progress: { new: 9, learning: 1, mastered: 0 },
      dueCount: 10, // 9 unseen + 1 due
    })
    expect(parts[2]).toEqual({
      part: 3,
      wordCount: 10,
      progress: { new: 9, learning: 0, mastered: 1 },
      dueCount: 10, // 9 unseen + 1 due (no reviewDueAfter date)
    })
  })
})
