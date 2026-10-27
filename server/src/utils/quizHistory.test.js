import { describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import {
  calculatePercentage,
  validateQuizSessionPayload,
  validateQuizHistoryQuery,
  buildQuizHistoryPipeline,
} from './quizHistory.js'

describe('calculatePercentage', () => {
  it('calculates correct percentages rounded to nearest integer', () => {
    expect(calculatePercentage(8, 10)).toBe(80)
    expect(calculatePercentage(1, 3)).toBe(33)
    expect(calculatePercentage(2, 3)).toBe(67)
    expect(calculatePercentage(0, 5)).toBe(0)
  })

  it('handles zero or negative totals safely', () => {
    expect(calculatePercentage(5, 0)).toBe(0)
    expect(calculatePercentage(5, -1)).toBe(0)
  })
})

describe('validateQuizSessionPayload', () => {
  const validWordId = new mongoose.Types.ObjectId().toHexString()
  const validPayload = {
    deckTitle: 'Group 1 · Part 1',
    score: 4,
    total: 5,
    timeSpentSeconds: 65,
    answers: [
      {
        wordId: validWordId,
        word: 'abate',
        definition: 'to decrease; reduce',
        partOfSpeech: 'verb',
        userAnswer: 'to decrease; reduce',
        correctAnswer: 'to decrease; reduce',
        correct: true,
      },
    ],
  }

  it('accepts valid payload and computes percentage', () => {
    const res = validateQuizSessionPayload(validPayload)
    expect(res.valid).toBe(true)
    expect(res.data.percentage).toBe(80)
    expect(res.data.score).toBe(4)
    expect(res.data.total).toBe(5)
    expect(res.data.deckTitle).toBe('Group 1 · Part 1')
  })

  it('rejects missing or empty deckTitle', () => {
    expect(validateQuizSessionPayload({ ...validPayload, deckTitle: '' })).toEqual({
      valid: false,
      error: 'deckTitle is required',
    })
  })

  it('rejects invalid score or total', () => {
    expect(validateQuizSessionPayload({ ...validPayload, score: -1 })).toEqual({
      valid: false,
      error: 'score must be a non-negative integer',
    })
    expect(validateQuizSessionPayload({ ...validPayload, total: 0 })).toEqual({
      valid: false,
      error: 'total must be an integer greater than 0',
    })
    expect(validateQuizSessionPayload({ ...validPayload, score: 6, total: 5 })).toEqual({
      valid: false,
      error: 'score cannot exceed total',
    })
  })

  it('rejects invalid answers array', () => {
    expect(validateQuizSessionPayload({ ...validPayload, answers: [] })).toEqual({
      valid: false,
      error: 'answers must be a non-empty array',
    })
    expect(
      validateQuizSessionPayload({
        ...validPayload,
        answers: [{ wordId: 'invalid', word: 'foo', correct: true }],
      })
    ).toEqual({
      valid: false,
      error: 'Invalid wordId in answer at index 0',
    })
  })
})

describe('validateQuizHistoryQuery', () => {
  it('returns default page 1 and limit 10', () => {
    expect(validateQuizHistoryQuery({})).toEqual({ page: 1, limit: 10 })
  })

  it('clamps page and limit within boundaries', () => {
    expect(validateQuizHistoryQuery({ page: '-5', limit: '200' })).toEqual({
      page: 1,
      limit: 50,
    })
  })

  it('rejects non-integer parameters', () => {
    expect(validateQuizHistoryQuery({ page: 'abc' })).toEqual({
      error: 'page must be an integer',
    })
    expect(validateQuizHistoryQuery({ limit: 'xyz' })).toEqual({
      error: 'limit must be an integer',
    })
  })
})

describe('buildQuizHistoryPipeline', () => {
  const dummyId = new mongoose.Types.ObjectId()

  it('builds pipeline with facet stages for sessions and stats', () => {
    const pipeline = buildQuizHistoryPipeline(dummyId, { page: 1, limit: 10 })
    expect(pipeline[0].$match.userId).toEqual(dummyId)
    expect(pipeline[1].$facet.sessions).toBeDefined()
    expect(pipeline[1].$facet.stats).toBeDefined()
    expect(pipeline[1].$facet.totalCount).toBeDefined()
  })
})
