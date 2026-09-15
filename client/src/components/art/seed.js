// Deterministic seed + pick for generative art. Seeded (never Math.random
// in render) so covers are stable across renders, sessions, and devices.

export function hashSeed(str) {
  let h = 5381
  const s = String(str ?? '')
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function pickSeeded(list, seed) {
  if (!Array.isArray(list) || list.length === 0) return undefined
  return list[hashSeed(seed) % list.length]
}
