import { describe, expect, it } from 'vitest'
import { filterDecks } from './deckFilter.js'

const DECKS = [
  { _id: '1', title: 'Group 1', group: 1 },
  { _id: '2', title: 'Group 12', group: 12 },
  { _id: '3', title: 'My Words', group: null },
]

describe('filterDecks', () => {
  it('returns everything on empty query', () => {
    expect(filterDecks(DECKS, '')).toHaveLength(3)
    expect(filterDecks(DECKS, '   ')).toHaveLength(3)
  })

  it('matches titles case-insensitively', () => {
    expect(filterDecks(DECKS, 'my words')).toHaveLength(1)
    expect(filterDecks(DECKS, 'GROUP')).toHaveLength(2)
  })

  it('matches partial group numbers', () => {
    expect(filterDecks(DECKS, '1').map((d) => d.title)).toEqual(['Group 1', 'Group 12'])
    expect(filterDecks(DECKS, '12').map((d) => d.title)).toEqual(['Group 12'])
  })

  it('returns empty when nothing matches', () => {
    expect(filterDecks(DECKS, 'zzz')).toEqual([])
  })
})
