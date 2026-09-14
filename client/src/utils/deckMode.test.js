import { describe, expect, it } from 'vitest'
import { modeFromPath } from './deckMode'

describe('modeFromPath', () => {
  it('maps the deck root to practice', () => {
    expect(modeFromPath('/decks/abc123')).toBe('practice')
    expect(modeFromPath('/decks/abc123/')).toBe('practice')
  })

  it('maps nested paths to quiz and typing', () => {
    expect(modeFromPath('/decks/abc123/quiz')).toBe('quiz')
    expect(modeFromPath('/decks/abc123/quiz/')).toBe('quiz')
    expect(modeFromPath('/decks/abc123/typing')).toBe('typing')
    expect(modeFromPath('/decks/abc123/typing/')).toBe('typing')
  })

  it('ignores unrelated paths', () => {
    expect(modeFromPath('/')).toBe('practice')
    expect(modeFromPath('/progress')).toBe('practice')
    expect(modeFromPath('/search')).toBe('practice')
  })
})
