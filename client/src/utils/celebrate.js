// Celebration gating: confetti fires on strong sessions (>=60%) or level-ups,
// never on a shutout. Shared by all four study modes so the moment means
// the same thing everywhere.
export const CELEBRATE_MIN_PCT = 60

export function sessionPct(correct, total) {
  if (!total) return 0
  return Math.round((correct / total) * 100)
}

export function shouldCelebrate({ correct = 0, total = 0, levelUp = false } = {}) {
  if (levelUp) return true
  return sessionPct(correct, total) >= CELEBRATE_MIN_PCT
}
