import { describe, it, expect } from 'vitest'
import { buildWordQueuePipeline, readWordQueue } from './wordQueue.js'

const match = { userId: 'user-1', status: { $ne: 'new' } }

describe('buildWordQueuePipeline', () => {
  it('filters by the caller match first', () => {
    const [first] = buildWordQueuePipeline({
      match,
      sort: { reviewDueAfter: 1 },
      limit: 20,
    })
    expect(first).toEqual({ $match: match })
  })

  it('joins words and drops progress rows whose word is gone', () => {
    const pipeline = buildWordQueuePipeline({
      match,
      sort: { reviewDueAfter: 1 },
      limit: 20,
    })
    const lookup = pipeline.find((stage) => stage.$lookup)
    const unwind = pipeline.find((stage) => stage.$unwind)

    expect(lookup.$lookup).toMatchObject({
      from: 'words',
      localField: 'wordId',
      foreignField: '_id',
      as: 'word',
    })
    // Unwinding is what removes the ghost rows; without it they survive the
    // facet and still count toward the total.
    expect(unwind).toEqual({ $unwind: '$word' })
    expect(pipeline.indexOf(unwind)).toBeGreaterThan(pipeline.indexOf(lookup))
  })

  it('applies the sort and limit inside the facet, after the ghost filter', () => {
    const pipeline = buildWordQueuePipeline({
      match,
      sort: { streakCorrect: 1, lastReviewed: -1 },
      limit: 7,
    })
    const facet = pipeline[pipeline.length - 1].$facet

    expect(facet.total).toEqual([{ $count: 'count' }])
    expect(facet.words).toEqual([
      { $sort: { streakCorrect: 1, lastReviewed: -1 } },
      { $limit: 7 },
      { $replaceRoot: { newRoot: '$word' } },
    ])
  })
})

describe('readWordQueue', () => {
  it('returns the words and total from the facet', () => {
    expect(
      readWordQueue([{ words: [{ word: 'abate' }], total: [{ count: 14 }] }])
    ).toEqual({ words: [{ word: 'abate' }], total: 14 })
  })

  it('returns an empty queue when nothing matched', () => {
    expect(readWordQueue([])).toEqual({ words: [], total: 0 })
  })

  it('tolerates a facet without a total bucket', () => {
    expect(readWordQueue([{ words: [] }])).toEqual({ words: [], total: 0 })
  })
})
