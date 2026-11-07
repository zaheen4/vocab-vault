import { dayKey } from './date'

export function dayLabel(key, now = new Date()) {
  if (!key) return ''
  if (key === dayKey(now)) return 'Today'
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (key === dayKey(yesterday)) return 'Yesterday'
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function groupByDay(items = [], getDate, now = new Date()) {
  const groups = new Map()
  for (const item of items) {
    const raw = getDate(item)
    if (!raw) continue
    const date = raw instanceof Date ? raw : new Date(raw)
    if (Number.isNaN(date.getTime())) continue
    const key = dayKey(date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups].map(([key, dayItems]) => ({
    key,
    label: dayLabel(key, now),
    items: dayItems,
  }))
}
