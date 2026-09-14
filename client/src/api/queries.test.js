import { describe, expect, it, vi } from 'vitest'
import { invalidateAfterReview, isStarred } from './queries'

function fakeClient() {
  return { invalidateQueries: vi.fn() }
}

function callsOf(qc) {
  return qc.invalidateQueries.mock.calls.map((c) => c[0])
}

describe('invalidateAfterReview', () => {
  it('marks the practice session stale without refetching it', () => {
    const qc = fakeClient()
    invalidateAfterReview(qc, 'deck1')

    const sessionCalls = callsOf(qc).filter((c) => c.queryKey?.[0] === 'session')
    expect(sessionCalls).toEqual([
      { queryKey: ['session', 'deck1'], refetchType: 'none' },
    ])
  })

  it('still refreshes gamification, summary and the deck quiz pool', () => {
    const qc = fakeClient()
    invalidateAfterReview(qc, 'deck1')

    const calls = callsOf(qc)
    expect(calls).toContainEqual({ queryKey: ['gamification', 'me'] })
    expect(calls).toContainEqual({ queryKey: ['progress', 'summary'] })
    expect(calls).toContainEqual({ queryKey: ['quizpool', 'deck1'] })
  })

  it('skips deck-scoped keys when there is no deck id', () => {
    const qc = fakeClient()
    invalidateAfterReview(qc, undefined)

    const roots = callsOf(qc).map((c) => c.queryKey[0])
    expect(roots).toEqual(['gamification', 'progress'])
  })
})

describe('isStarred', () => {
  it('matches populated and optimistic entries', () => {
    const bookmarks = [
      { _id: 'b1', word: { _id: 'w1' } },
      { _id: 'temp-w2', word: { _id: 'w2' } },
    ]
    expect(isStarred(bookmarks, 'w1')).toBe(true)
    expect(isStarred(bookmarks, 'w2')).toBe(true)
    expect(isStarred(bookmarks, 'w3')).toBe(false)
  })

  it('is false for an empty cache', () => {
    expect(isStarred(undefined, 'w1')).toBe(false)
    expect(isStarred([], 'w1')).toBe(false)
  })
})
