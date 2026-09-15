import { describe, expect, it } from 'vitest'
import { hashSeed, pickSeeded } from './seed.js'

describe('hashSeed', () => {
  it('is stable for the same input', () => {
    expect(hashSeed('deck-123')).toBe(hashSeed('deck-123'))
  })

  it('spreads nearby ids apart', () => {
    const a = hashSeed('group-1')
    const b = hashSeed('group-2')
    expect(a).not.toBe(b)
  })

  it('tolerates empty input', () => {
    expect(Number.isInteger(hashSeed(''))).toBe(true)
    expect(Number.isInteger(hashSeed(null))).toBe(true)
  })
})

describe('pickSeeded', () => {
  const list = ['a', 'b', 'c', 'd']

  it('always lands in bounds', () => {
    for (const seed of ['x', 'y', 'group-37', '', 'custom-deck-id-123']) {
      expect(list).toContain(pickSeeded(list, seed))
    }
  })

  it('is deterministic per seed', () => {
    expect(pickSeeded(list, 'group-7')).toBe(pickSeeded(list, 'group-7'))
  })
})
