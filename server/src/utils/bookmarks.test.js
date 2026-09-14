import { describe, expect, it } from 'vitest'
import { masteryFor } from './bookmarks.js'

describe('masteryFor', () => {
  it('maps a missing record to new with box 0', () => {
    expect(masteryFor(null)).toEqual({ status: 'new', box: 0 })
    expect(masteryFor(undefined)).toEqual({ status: 'new', box: 0 })
  })

  it('maps learning records with their box', () => {
    expect(masteryFor({ status: 'learning', box: 3 })).toEqual({ status: 'learning', box: 3 })
  })

  it('maps mastered records', () => {
    expect(masteryFor({ status: 'mastered', box: 5 })).toEqual({ status: 'mastered', box: 5 })
  })
})
