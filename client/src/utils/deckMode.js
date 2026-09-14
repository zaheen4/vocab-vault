// Which study mode a deck URL points at. DeckLayout keeps all three modes
// mounted; this decides which one is visible.
export function modeFromPath(pathname) {
  if (/\/decks\/[^/]+\/quiz\/?$/.test(pathname)) return 'quiz'
  if (/\/decks\/[^/]+\/typing\/?$/.test(pathname)) return 'typing'
  return 'practice'
}
