import { describe, expect, it } from 'vitest'
import { filterDecks } from './deckFilter.js'

const DECKS = [
  { _id: '1', title: 'Group 1 — Part 1', group: 1, part: 1 },
  { _id: '2', title: 'Group 1 — Part 2', group: 1, part: 2 },
  { _id: '3', title: 'Group 12 — Part 1', group: 12, part: 1 },
  { _id: '4', title: 'My Words', group: null },
]

describe('filterDecks', () => {
  it('returns everything on empty query', () => {
    expect(filterDecks(DECKS, '')).toHaveLength(4)
    expect(filterDecks(DECKS, '   ')).toHaveLength(4)
  })

  it('matches titles case-insensitively', () => {
    expect(filterDecks(DECKS, 'my words')).toHaveLength(1)
    expect(filterDecks(DECKS, 'GROUP')).toHaveLength(3)
  })

  it('matches partial group numbers', () => {
    expect(filterDecks(DECKS, '1').map((d) => d.title)).toEqual([
      'Group 1 — Part 1',
      'Group 1 — Part 2',
      'Group 12 — Part 1',
    ])
    expect(filterDecks(DECKS, '12').map((d) => d.title)).toEqual(['Group 12 — Part 1'])
  })

  it('matches part shorthand like p1 and part 2', () => {
    expect(filterDecks(DECKS, 'p2').map((d) => d.title)).toEqual(['Group 1 — Part 2'])
    expect(filterDecks(DECKS, 'part 1').map((d) => d.title)).toEqual([
      'Group 1 — Part 1',
      'Group 12 — Part 1',
    ])
  })

  it('returns empty when nothing matches', () => {
    expect(filterDecks(DECKS, 'zzz')).toEqual([])
  })
})
