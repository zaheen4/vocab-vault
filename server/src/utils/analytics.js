export const MAX_ACTIVITY_DAYS = 60
export const MAX_HISTORY_ENTRIES = 20

function toDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Bump today's review count in user.activityLog (date-only buckets).
// Mutates the user doc; keeps the last MAX_ACTIVITY_DAYS entries.
export function recordActivity(user, now = new Date()) {
  const day = toDayStart(now).getTime()
  const log = user.activityLog || []
  const last = log[log.length - 1]
  if (last && toDayStart(new Date(last.date)).getTime() === day) {
    last.reviews = (last.reviews || 0) + 1
  } else {
    log.push({ date: toDayStart(now), reviews: 1 })
  }
  user.activityLog = log.slice(-MAX_ACTIVITY_DAYS)
}

// Append one review event to a progress history, newest last.
// Mutates the progress doc; keeps the last MAX_HISTORY_ENTRIES entries.
export function pushHistory(progress, { correct, box }, now = new Date()) {
  const history = progress.history || []
  history.push({ at: now, correct, box })
  progress.history = history.slice(-MAX_HISTORY_ENTRIES)
}
