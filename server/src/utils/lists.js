export const MAX_LIST_TITLE = 60

export function validateListTitle(title) {
  const trimmed = typeof title === 'string' ? title.trim() : ''
  if (!trimmed) return 'title is required'
  if (trimmed.length > MAX_LIST_TITLE) return `title must be at most ${MAX_LIST_TITLE} characters`
  return null
}
