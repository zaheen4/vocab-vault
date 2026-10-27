// Pure relative time formatter with standard human intervals.
// Respects custom reference time for deterministic testing.
export function formatRelativeTime(dateInput, now = new Date()) {
  if (!dateInput) return ''
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ''

  const nowDate = now instanceof Date ? now : new Date(now)
  const diffMs = nowDate.getTime() - date.getTime()

  // Future timestamp or less than 60 seconds
  if (diffMs < 60 * 1000) {
    return 'just now'
  }

  const diffMins = Math.floor(diffMs / (60 * 1000))
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 1) {
    return 'yesterday'
  }
  if (diffDays < 30) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
