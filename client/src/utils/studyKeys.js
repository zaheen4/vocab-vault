const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const CONTROL_TAGS = new Set(['BUTTON', 'A', 'SUMMARY'])

export function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false
  if (target.isContentEditable) return true
  return EDITABLE_TAGS.has(String(target.tagName ?? '').toUpperCase())
}

export function isControlTarget(target) {
  if (!target || typeof target !== 'object') return false
  return CONTROL_TAGS.has(String(target.tagName ?? '').toUpperCase())
}

export function resolveStudyKey({
  key,
  flipped = false,
  hasFeedback = false,
  enabled = true,
  target = null,
} = {}) {
  if (!enabled) return null
  if (typeof key !== 'string' || key.length === 0) return null
  if (isEditableTarget(target)) return null

  const lower = key.toLowerCase()

  if (lower === 's') return 'speak'
  if (lower === 'r') return 'reverse'
  if (lower === 'b') return 'bookmark'

  if (hasFeedback) return null

  if (key === '1') return flipped ? 'again' : null
  if (key === '2') return flipped ? 'got-it' : null

  if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
    if (isControlTarget(target)) return null
    if (key === 'Enter' && flipped) return 'got-it'
    return 'flip'
  }

  return null
}
