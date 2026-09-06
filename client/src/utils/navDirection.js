// Tab-switch direction for directional slide animations.
// ModeTabs records where the user is heading; the newly mounted page reads
// it once and picks its entrance. Direct URL loads and back/forward buttons
// record nothing, so those fall back to the generic fade.
const ORDER = [
  { match: /\/decks\/[^/]+$/, index: 0 },
  { match: /\/decks\/[^/]+\/quiz$/, index: 1 },
  { match: /\/decks\/[^/]+\/typing$/, index: 2 },
]

function orderOf(path) {
  const hit = ORDER.find((r) => r.match.test(path))
  return hit ? hit.index : null
}

let pending = null

export function noteTabSwitch(fromPath, toPath) {
  const from = orderOf(fromPath)
  const to = orderOf(toPath)
  pending = from === null || to === null || from === to ? null : to > from ? 'forward' : 'back'
}

import { useState } from 'react'

export function consumeDirection() {
  const dir = pending
  pending = null
  return dir
}

// Entrance class for the newly mounted mode surface. Consumed once per
// mount so later re-renders (answers, feedback) never retrigger it.
export function useSlideDirection() {
  const [dir] = useState(() => consumeDirection())
  if (dir === 'forward') return 'animate-slide-forward'
  if (dir === 'back') return 'animate-slide-back'
  return ''
}
