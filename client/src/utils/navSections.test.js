import { describe, expect, it } from 'vitest'
import { isSectionActive } from './navSections'

describe('isSectionActive', () => {
  it('keeps Decks active on the library and deck detail routes', () => {
    expect(isSectionActive('/', 'decks')).toBe(true)
    expect(isSectionActive('/decks', 'decks')).toBe(true)
    expect(isSectionActive('/decks/abc123', 'decks')).toBe(true)
    expect(isSectionActive('/search', 'decks')).toBe(false)
  })

  it('keeps Review active only on the due queue', () => {
    expect(isSectionActive('/practice/due', 'review')).toBe(true)
    expect(isSectionActive('/practice/due/', 'review')).toBe(true)
    expect(isSectionActive('/practice/weak', 'review')).toBe(false)
    expect(isSectionActive('/bookmarks/practice', 'review')).toBe(false)
  })

  it('keeps Saved active across bookmarks and saved practice', () => {
    expect(isSectionActive('/bookmarks', 'saved')).toBe(true)
    expect(isSectionActive('/bookmarks/practice', 'saved')).toBe(true)
    expect(isSectionActive('/bookmarks/practice/', 'saved')).toBe(true)
  })

  it('keeps Progress active on the dashboard and history', () => {
    expect(isSectionActive('/progress', 'progress')).toBe(true)
    expect(isSectionActive('/history', 'progress')).toBe(true)
    expect(isSectionActive('/history/', 'progress')).toBe(true)
    expect(isSectionActive('/practice/weak', 'progress')).toBe(false)
  })

  it('matches Search exactly and ignores unknown sections', () => {
    expect(isSectionActive('/search', 'search')).toBe(true)
    expect(isSectionActive('/search/', 'search')).toBe(true)
    expect(isSectionActive('/searching', 'search')).toBe(false)
    expect(isSectionActive('/search', 'nope')).toBe(false)
  })
})
