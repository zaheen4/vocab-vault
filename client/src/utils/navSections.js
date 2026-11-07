const SECTIONS = {
  decks: (path) => path === '/' || path === '/decks' || path.startsWith('/decks/'),
  review: (path) => path === '/practice/due' || path.startsWith('/practice/due/'),
  search: (path) => path === '/search' || path.startsWith('/search/'),
  saved: (path) => path === '/bookmarks' || path.startsWith('/bookmarks/'),
  progress: (path) => path === '/progress' || path === '/history' || path.startsWith('/history/'),
}

function normalize(pathname) {
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

export function isSectionActive(pathname, section) {
  const check = SECTIONS[section]
  return check ? check(normalize(pathname)) : false
}
