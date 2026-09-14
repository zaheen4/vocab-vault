// XP curve: level 1 at 0 XP, next levels require progressively more XP.
// derived XP -> level via sqrt curve: level = floor(sqrt(xp / 100)) + 1
const XP_PER_LEVEL_BASE = 100
export const MAX_STREAK_FREEZES = 1

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

// Strip time and return a UTC-only date bucket (avoids DST drift).
function toDayKey(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

// Update a user's daily practice streak. Idempotent within a day.
// Returns { dailyStreak, streakIncreased, freezeUsed }
export function applyDailyStreak(user, now = new Date()) {
  const todayKey = toDayKey(now)
  let streak = user.practiceStreakDays || 0
  let freezeUsed = false

  if (!user.lastPracticeDate) {
    streak = 1
  } else {
    const lastKey = toDayKey(new Date(user.lastPracticeDate))
    const diffDays = Math.round((todayKey - lastKey) / 86400000)

    if (diffDays === 0) {
      // already practiced today — keep streak
    } else if (diffDays === 1) {
      streak += 1
    } else if (diffDays === 2 && (user.streakFreezes || 0) > 0) {
      // 1-day gap: survive via freeze
      streak += 1
      freezeUsed = true
      user.streakFreezes = (user.streakFreezes || 1) - 1
    } else {
      // gap of 2+ without freeze, or 3+ — streak breaks
      streak = 1
    }
  }

  return { dailyStreak: streak, streakIncreased: streak > (user.practiceStreakDays || 0), freezeUsed }
}

// Check whether daily goal has been met and award a freeze refill.
// Returns { goalMet, freezeRefilled }
export function awardGoalRefill(user, now = new Date()) {
  const todayKey = toDayKey(now)
  const reviewsToday = user.reviewsToday || 0
  const target = user.dailyGoalTarget || 10

  if (reviewsToday < target) return { goalMet: false, freezeRefilled: false }

  // Already awarded today?
  if (user.goalMetDate && toDayKey(new Date(user.goalMetDate)) === todayKey) {
    return { goalMet: true, freezeRefilled: false }
  }

  user.streakFreezes = MAX_STREAK_FREEZES
  user.goalsMet = (user.goalsMet || 0) + 1
  user.goalMetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return { goalMet: true, freezeRefilled: true }
}
