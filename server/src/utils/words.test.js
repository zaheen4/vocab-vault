import { describe, expect, it } from 'vitest'
import { validateCustomWord } from './words.js'

describe('validateCustomWord', () => {
  it('accepts a minimal word + definition', () => {
    expect(validateCustomWord({ word: 'serendipity', definition: 'happy chance' })).toBeNull()
  })

  it('accepts all optional fields when valid', () => {
    expect(
      validateCustomWord({
        word: 'serendipity',
        definition: 'happy chance',
        example: 'What serendipity!',
        partOfSpeech: 'noun',
        difficulty: 'advanced',
      })
    ).toBeNull()
  })

  it('rejects missing or blank word and definition', () => {
    expect(validateCustomWord({})).toBe('word is required')
    expect(validateCustomWord({ word: '  ', definition: 'x' })).toBe('word is required')
    expect(validateCustomWord({ word: 'x' })).toBe('definition is required')
    expect(validateCustomWord({ word: 'x', definition: '  ' })).toBe('definition is required')
  })

  it('rejects an invalid difficulty', () => {
    expect(validateCustomWord({ word: 'x', definition: 'y', difficulty: 'hard' })).toContain(
      'difficulty must be one of'
    )
  })
})
