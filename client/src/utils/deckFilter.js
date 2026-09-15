// Pure deck-list filter for the home finder box. Matches title substring
// (case-insensitive) or group number (partial digits: "1" matches groups
// 1, 10-19, 21, 31). Empty query returns the full list.
export function filterDecks(decks, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return decks
  const digits = q.replace(/[^0-9]/g, '')
  return (decks || []).filter((d) => {
    const title = String(d?.title ?? '').toLowerCase()
    if (title.includes(q)) return true
    if (digits && d?.group != null && String(d.group).includes(digits)) return true
    return false
  })
}
