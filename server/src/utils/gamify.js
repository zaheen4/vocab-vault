// XP curve: level 1 at 0 XP, next levels require progressively more XP.
// derived XP -> level via sqrt curve: level = floor(sqrt(xp / 100)) + 1
const XP_PER_LEVEL_BASE = 100

export function xpForAnswer(correct, box = 1) {
  // correct: more XP for higher boxes (well-retrieved = more valuable)
  if (!correct) return 3 // still reward attempting
  return 10 + (box || 1) * 2
}

export function levelFor(xp) {
  return Math.floor(Math.sqrt((xp || 0) / XP_PER_LEVEL_BASE)) + 1
}

export function xpForLevel(level) {
  // cumulative XP threshold to reach `level`
  return XP_PER_LEVEL_BASE * (level - 1) * (level - 1)
}

export function xpProgress(level, xp) {
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const span = next - current
  const into = Math.max(0, (xp || 0) - current)
  return { current, next, progress: span <= 0 ? 0 : Math.min(1, into / span) }
}

// Update a user's daily practice streak. Idempotent within a day.
// Returns { dailyStreak, streakIncreased }
export function applyDailyStreak(user, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let streak = user.practiceStreakDays || 0
  let increased = false

  if (!user.lastPracticeDate) {
    streak = 1
    increased = true
  } else {
    const last = new Date(user.lastPracticeDate)
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate())
    const diffDays = Math.round((today - lastDay) / 86400000)
    if (today.getTime() === lastDay.getTime()) {
      // already practiced today — keep streak
      increased = false
    } else if (diffDays === 1) {
      streak += 1
      increased = true
    } else {
      // gap of 2+ days — streak breaks and restarts
      streak = 1
      increased = true
    }
  }

  return { dailyStreak: streak, streakIncreased: increased }
}
