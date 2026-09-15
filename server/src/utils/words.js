export const WORD_DIFFICULTIES = ['basic', 'intermediate', 'advanced']

// Pure validation for POST /api/words. Returns an error message string,
// or null when the body is valid.
export function validateCustomWord(body) {
  const word = typeof body?.word === 'string' ? body.word.trim() : ''
  const definition = typeof body?.definition === 'string' ? body.definition.trim() : ''
  if (!word) return 'word is required'
  if (word.length > 100) return 'word must be at most 100 characters'
  if (!definition) return 'definition is required'
  if (definition.length > 2000) return 'definition must be at most 2000 characters'
  if (typeof body?.example === 'string' && body.example.trim().length > 2000) {
    return 'example must be at most 2000 characters'
  }
  if (typeof body?.partOfSpeech === 'string' && body.partOfSpeech.trim().length > 50) {
    return 'partOfSpeech must be at most 50 characters'
  }
  if (body?.difficulty !== undefined && !WORD_DIFFICULTIES.includes(body.difficulty)) {
    return `difficulty must be one of: ${WORD_DIFFICULTIES.join(', ')}`
  }
  return null
}
