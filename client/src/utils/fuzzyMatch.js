// Lenient spelling check for typing mode: case, surrounding whitespace and
// punctuation are ignored; small typos scale with word length.
export function normalizeAnswer(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')
}

export function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = curr
  }
  return prev[b.length]
}

export function toleranceFor(word) {
  return Math.max(1, Math.floor(normalizeAnswer(word).length / 5))
}

export function isCorrectSpelling(expected, actual) {
  const e = normalizeAnswer(expected)
  const a = normalizeAnswer(actual)
  if (!e || !a) return false
  if (e === a) return true
  return levenshtein(e, a) <= toleranceFor(expected)
}
