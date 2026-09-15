import { describe, expect, it } from 'vitest'
import { summarizeDeckProgress } from './decks.js'

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
