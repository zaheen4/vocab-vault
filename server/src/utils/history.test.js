import { describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { buildHistoryPipeline, validateHistoryQuery } from './history.js'

describe('validateHistoryQuery', () => {
  it('returns default page 1, limit 20, filter all when empty', () => {
    const result = validateHistoryQuery({})
    expect(result).toEqual({ page: 1, limit: 20, filter: 'all' })
  })

  it('parses valid numeric strings', () => {
    const result = validateHistoryQuery({ page: '3', limit: '15', filter: 'correct' })
    expect(result).toEqual({ page: 3, limit: 15, filter: 'correct' })
  })

  it('clamps page between 1 and 1000', () => {
    expect(validateHistoryQuery({ page: '-5' }).page).toBe(1)
    expect(validateHistoryQuery({ page: '0' }).page).toBe(1)
    expect(validateHistoryQuery({ page: '5000' }).page).toBe(1000)
  })

  it('clamps limit between 1 and 100', () => {
    expect(validateHistoryQuery({ limit: '-10' }).limit).toBe(1)
    expect(validateHistoryQuery({ limit: '0' }).limit).toBe(1)
    expect(validateHistoryQuery({ limit: '250' }).limit).toBe(100)
  })

  it('rejects non-integer page', () => {
    expect(validateHistoryQuery({ page: 'abc' })).toEqual({ error: 'page must be an integer' })
    expect(validateHistoryQuery({ page: '2.5' })).toEqual({ error: 'page must be an integer' })
  })

  it('rejects non-integer limit', () => {
    expect(validateHistoryQuery({ limit: 'invalid' })).toEqual({ error: 'limit must be an integer' })
    expect(validateHistoryQuery({ limit: '10.5' })).toEqual({ error: 'limit must be an integer' })
  })

  it('rejects invalid filter enum', () => {
    expect(validateHistoryQuery({ filter: 'random' })).toEqual({
      error: "filter must be one of: 'all', 'correct', 'incorrect'",
    })
  })

  it('accepts valid filter values case-insensitively', () => {
    expect(validateHistoryQuery({ filter: 'CORRECT' }).filter).toBe('correct')
    expect(validateHistoryQuery({ filter: 'Incorrect' }).filter).toBe('incorrect')
    expect(validateHistoryQuery({ filter: 'ALL' }).filter).toBe('all')
  })
})

describe('buildHistoryPipeline', () => {
  const dummyId = new mongoose.Types.ObjectId()

  it('builds pipeline with default parameters', () => {
    const pipeline = buildHistoryPipeline(dummyId)
    expect(pipeline[0].$match.userId).toEqual(dummyId)

    const lookupStage = pipeline.find((stage) => stage.$lookup)
    expect(lookupStage).toBeDefined()
    expect(lookupStage.$lookup.from).toBe('words')

    const facetStage = pipeline.find((stage) => stage.$facet)
    expect(facetStage).toBeDefined()
    expect(facetStage.$facet.data[0].$skip).toBe(0)
    expect(facetStage.$facet.data[1].$limit).toBe(20)
  })

  it('resolves the word before unwinding history', () => {
    const pipeline = buildHistoryPipeline(dummyId)
    const lookupIndex = pipeline.findIndex((stage) => stage.$lookup)
    const historyUnwindIndex = pipeline.findIndex(
      (stage) => stage.$unwind?.path === '$history'
    )

    expect(lookupIndex).toBeGreaterThan(0)
    expect(historyUnwindIndex).toBeGreaterThan(lookupIndex)
    expect(pipeline[historyUnwindIndex].$unwind).toEqual({
      path: '$history',
      includeArrayIndex: 'historyIndex',
    })
  })

  it('sorts with tiebreakers so paging is stable', () => {
    const pipeline = buildHistoryPipeline(dummyId)
    const sortStage = pipeline.find((stage) => stage.$sort)
    expect(sortStage.$sort).toEqual({
      'history.at': -1,
      historyIndex: -1,
      _id: -1,
    })
  })

  it('keeps reviewId unique for two reviews at the same instant', () => {
    const pipeline = buildHistoryPipeline(dummyId)
    const project = pipeline.find((stage) => stage.$facet).$facet.data[2].$project
    const parts = project.reviewId.$concat

    expect(parts[0]).toEqual({ $toString: '$_id' })
    expect(parts[parts.length - 1]).toEqual({ $toString: '$historyIndex' })
  })

  it('applies correct filter match stage when filter is correct', () => {
    const pipeline = buildHistoryPipeline(dummyId, { page: 2, limit: 10, filter: 'correct' })
    const filterStage = pipeline.find(
      (stage) => stage.$match?.['history.correct'] === true
    )
    expect(filterStage).toBeDefined()

    const facetStage = pipeline.find((stage) => stage.$facet)
    expect(facetStage.$facet.data[0].$skip).toBe(10)
    expect(facetStage.$facet.data[1].$limit).toBe(10)
  })

  it('applies incorrect filter match stage when filter is incorrect', () => {
    const pipeline = buildHistoryPipeline(dummyId, { page: 1, limit: 50, filter: 'incorrect' })
    const filterStage = pipeline.find(
      (stage) => stage.$match?.['history.correct'] === false
    )
    expect(filterStage).toBeDefined()
  })

  it('handles string userId conversion', () => {
    const idString = dummyId.toHexString()
    const pipeline = buildHistoryPipeline(idString)
    expect(pipeline[0].$match.userId).toEqual(dummyId)
  })
})
