import { describe, expect, it, vi } from 'vitest'
import { invalidateAfterReview } from './queries'

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
