// Keyboard map for flashcard study sessions. Pure resolution, so the rules are
// testable without a DOM: the hook only translates actions into callbacks.
//
//   Space / Enter  flip (Enter also answers "Got it" once the card is open)
//   1              Again (missed)
//   2              Got it (remembered)
//   S / R / B      speak, reverse, bookmark
//
// Keys never fire while typing in a field, and the flip keys never fire while a
// native control has focus — the browser already activates buttons and links.

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
    // Space/Enter on a focused button would double-fire the native click.
    if (isControlTarget(target)) return null
    if (key === 'Enter' && flipped) return 'got-it'
    return 'flip'
  }

  return null
}
