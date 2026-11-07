import { dayKey } from './date'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function weekDays(activity = [], now = new Date()) {
  const byDate = new Map((activity || []).map((entry) => [entry.date, entry.reviews || 0]))
  const days = []
  for (let back = 6; back >= 0; back -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back)
    const key = dayKey(date)
    days.push({
      key,
      letter: DAY_LETTERS[date.getDay()],
      isToday: back === 0,
      reviews: byDate.get(key) || 0,
    })
  }
  return days
}

export function weekTotal(days = []) {
  return days.reduce((sum, day) => sum + day.reviews, 0)
}

export function weekLevel(reviews, max) {
  if (!reviews) return 0
  const ratio = reviews / Math.max(1, max)
  if (ratio < 0.34) return 1
  if (ratio < 0.67) return 2
  return 3
}
