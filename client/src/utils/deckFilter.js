// Pure deck-list filter for the home finder box. Matches title substring
// (case-insensitive), group/part numbers (partial digits: "1" matches groups
// 1, 10-19, 21, 31, or "p1" / "part 1" matches part 1 decks). Empty query returns the full list.
export function filterDecks(decks, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return decks
  const partMatch = q.match(/^p(?:art)?\s*([1-3])$/)
  if (partMatch) {
    const targetPart = Number(partMatch[1])
    return (decks || []).filter(
      (d) => d?.part === targetPart || String(d?.title ?? '').toLowerCase().includes(q)
    )
  }
  const digits = q.replace(/[^0-9]/g, '')
  return (decks || []).filter((d) => {
    const title = String(d?.title ?? '').toLowerCase()
    if (title.includes(q)) return true
    if (digits && d?.group != null && String(d.group).includes(digits)) return true
    return false
  })
}
