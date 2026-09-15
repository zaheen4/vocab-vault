// Pure per-deck progress summarizer for GET /api/decks.
// decks: [{ _id, wordIds }] (wordIds may be ObjectIds or strings).
// progressByWord: Map-like wordId-string -> 'new' | 'learning' | 'mastered'.
// Words without a record count as new (never reviewed).
export function summarizeDeckProgress(decks, progressByWord) {
  const get = (wid) => {
    const key = typeof wid === 'string' ? wid : String(wid?._id ?? wid)
    return progressByWord?.get?.(key) ?? 'new'
  }
  return decks.map((deck) => {
    const ids = deck.wordIds || []
    const progress = { new: 0, learning: 0, mastered: 0 }
    for (const wid of ids) {
      const status = get(wid)
      if (status === 'learning') progress.learning += 1
      else if (status === 'mastered') progress.mastered += 1
      else progress.new += 1
    }
    return { deckId: String(deck._id), progress }
  })
}

// Pure per-deck due counter for GET /api/decks.
// detailByWord: Map wordId-string -> { status, reviewDueAfter } (fields optional).
// Mirrors the practice-pool selection order exactly: unseen words first, then
// seen words whose due date has passed (or was never set). Seen-but-not-due
// words are excluded until their SRS date arrives.
export function countDeckDue(decks, detailByWord, now = new Date()) {
  const get = (wid) => {
    const key = typeof wid === 'string' ? wid : String(wid?._id ?? wid)
    return detailByWord?.get?.(key) ?? null
  }
  return decks.map((deck) => {
    const ids = deck.wordIds || []
    let dueCount = 0
    for (const wid of ids) {
      const rec = get(wid)
      if (!rec) {
        dueCount += 1 // unseen: always practicable
      } else if (!rec.reviewDueAfter || new Date(rec.reviewDueAfter) <= now) {
        dueCount += 1
      }
    }
    return { deckId: String(deck._id), dueCount }
  })
}
