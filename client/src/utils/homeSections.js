export const DECK_STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'due', label: 'Due' },
  { id: 'new', label: 'New' },
  { id: 'mastered', label: 'Mastered' },
]

export function deckTotals(deck) {
  const parts = deck?.parts ?? []
  const source =
    deck?.progress == null && parts.length > 0
      ? parts.reduce(
          (acc, part) => {
            acc.wordCount += part.wordCount ?? 0
            acc.dueCount += part.dueCount ?? 0
            acc.progress.new += part.progress?.new ?? 0
            acc.progress.learning += part.progress?.learning ?? 0
            acc.progress.mastered += part.progress?.mastered ?? 0
            return acc
          },
          { wordCount: 0, dueCount: 0, progress: { new: 0, learning: 0, mastered: 0 } }
        )
      : deck
  const count = source?.wordCount ?? source?.wordIds?.length ?? 0
  const progress = source?.progress ?? {}
  const learning = progress.learning ?? 0
  const mastered = progress.mastered ?? 0
  const seen = learning + mastered
  const unseen = progress.new ?? Math.max(0, count - seen)
  const due = source?.dueCount ?? 0
  return {
    count,
    learning,
    mastered,
    seen,
    unseen,
    due,
    reviewDue: Math.max(0, due - unseen),
    started: seen > 0,
    pct: count > 0 ? Math.round((mastered / count) * 100) : 0,
    complete: count > 0 && mastered === count,
  }
}

export function matchesDeckStatus(deck, status) {
  const totals = deckTotals(deck)
  switch (status) {
    case 'in-progress':
      return totals.started && !totals.complete
    case 'due':
      return totals.reviewDue > 0
    case 'new':
      return !totals.started
    case 'mastered':
      return totals.complete
    default:
      return true
  }
}

export function filterDecksByStatus(decks, status) {
  if (!status || status === 'all') return decks ?? []
  return (decks ?? []).filter((deck) => matchesDeckStatus(deck, status))
}

const byGroup = (a, b) => (a.group ?? Number.POSITIVE_INFINITY) - (b.group ?? Number.POSITIVE_INFINITY)

export function pickContinueDeck(decks) {
  const ordered = [...(decks ?? [])].sort(byGroup)
  return (
    ordered.find((deck) => {
      const totals = deckTotals(deck)
      return totals.started && totals.reviewDue > 0
    }) ??
    ordered.find((deck) => deckTotals(deck).learning > 0) ??
    ordered.find((deck) => deckTotals(deck).started) ??
    ordered[0] ??
    null
  )
}

export function nextDeckPart(deck) {
  const parts = deck?.parts ?? []
  if (parts.length === 0) return null
  const due = parts.find((part) => (part.dueCount ?? 0) > 0)
  if (due) return due.part
  const unfinished = parts.find(
    (part) => (part.progress?.mastered ?? 0) < (part.wordCount ?? 0)
  )
  return (unfinished ?? parts[0]).part
}

export function deckAction(deck) {
  if (!deck?._id) return null
  const totals = deckTotals(deck)
  const query = nextDeckPart(deck)
  const to = query ? `/decks/${deck._id}?part=${query}` : `/decks/${deck._id}`

  if (!totals.started) return { label: 'Start deck →', to }
  if (totals.complete) return { label: 'Review deck →', to }
  return { label: query ? `Continue Part ${query} →` : 'Continue deck →', to }
}

export function goalProgress(reviewsToday = 0, target = 0) {
  const reviews = Math.max(0, reviewsToday)
  const goal = Math.max(0, target)
  const pct = goal > 0 ? Math.min(100, Math.round((reviews / goal) * 100)) : 0
  return {
    reviews,
    goal,
    pct,
    remaining: Math.max(0, goal - reviews),
    met: goal > 0 && reviews >= goal,
  }
}
