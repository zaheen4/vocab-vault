export const WORD_DIFFICULTIES = ['basic', 'intermediate', 'advanced']

// Pure validation for POST /api/words. Returns an error message string,
// or null when the body is valid.
export function validateCustomWord(body) {
  const word = typeof body?.word === 'string' ? body.word.trim() : ''
  const definition = typeof body?.definition === 'string' ? body.definition.trim() : ''
  if (!word) return 'word is required'
  if (!definition) return 'definition is required'
  if (body?.difficulty !== undefined && !WORD_DIFFICULTIES.includes(body.difficulty)) {
    return `difficulty must be one of: ${WORD_DIFFICULTIES.join(', ')}`
  }
  return null
}
