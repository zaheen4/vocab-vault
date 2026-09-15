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
