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

const PART_ORDER = { all: 0, 1: 1, 2: 2, 3: 3 }

export function noteTabSwitch(fromPath, toPath) {
  const from = orderOf(fromPath)
  const to = orderOf(toPath)
  pending = from === null || to === null || from === to ? null : to > from ? 'forward' : 'back'
}

export function notePartSwitch(fromPart, toPart) {
  const from = PART_ORDER[fromPart ?? 'all']
  const to = PART_ORDER[toPart ?? 'all']
  pending = from == null || to == null || from === to ? null : to > from ? 'forward' : 'back'
}

import { useState } from 'react'

export function consumeDirection() {
  const dir = pending
  pending = null
  return dir
}

export function useSlideDirection() {
  const [dir] = useState(() => consumeDirection())
  if (dir === 'forward') return 'animate-slide-forward'
  if (dir === 'back') return 'animate-slide-back'
  return ''
}
