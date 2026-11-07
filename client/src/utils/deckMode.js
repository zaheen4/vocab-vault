export function modeFromPath(pathname) {
  if (/\/decks\/[^/]+\/quiz\/?$/.test(pathname)) return 'quiz'
  if (/\/decks\/[^/]+\/typing\/?$/.test(pathname)) return 'typing'
  return 'practice'
}
