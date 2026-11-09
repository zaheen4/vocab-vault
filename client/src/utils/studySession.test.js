import { describe, expect, it } from 'vitest'
import {
  boxLabel,
  initialSessionTally,
  sessionMessageInput,
  sessionProgress,
  tallyAnswer,
} from './studySession.js'

describe('boxLabel', () => {
  it('names the five Leitner boxes', () => {
    expect(boxLabel(1)).toBe('Box 1')
    expect(boxLabel(5)).toBe('Mastered')
  })

  it('falls back for unknown boxes', () => {
    expect(boxLabel(9)).toBe('Box 9')
  })
})

describe('tallyAnswer', () => {
  it('counts a correct answer and grows the combo', () => {
    const t = tallyAnswer(initialSessionTally(), { correct: true })
    expect(t).toMatchObject({ correct: 1, total: 1, combo: 1, bestCombo: 1 })
  })

  it('resets the combo on a miss but keeps the best combo', () => {
    let t = tallyAnswer(initialSessionTally(), { correct: true })
    t = tallyAnswer(t, { correct: true })
    t = tallyAnswer(t, { correct: false })
    expect(t).toMatchObject({ correct: 2, total: 3, combo: 0, bestCombo: 2 })
  })

  it('adds xp, learned and mastered counts from gamification', () => {
    const t = tallyAnswer(initialSessionTally(), {
      correct: true,
      gamification: { xpEarned: 14, newWordsLearned: 2, reviewsCaughtUp: 1 },
    })
    expect(t).toMatchObject({ xp: 14, newLearned: 2, caughtUp: 1 })
  })

  it('treats a missing gamification payload as zero', () => {
    const t = tallyAnswer(initialSessionTally(), { correct: true })
    expect(t).toMatchObject({ xp: 0, newLearned: 0, caughtUp: 0, levelUp: false })
  })

  it('latches level-up and records the event once', () => {
    let t = tallyAnswer(initialSessionTally(), {
      correct: true,
      gamification: { levelUp: true, level: 4, xp: 120 },
    })
    expect(t.levelUp).toBe(true)
    expect(t.levelEvent).toEqual({ newLevel: 4, xp: 120 })

    t = tallyAnswer(t, { correct: true, gamification: { xpEarned: 5, level: 4 } })
    expect(t.levelUp).toBe(true)
    expect(t.levelEvent).toEqual({ newLevel: 4, xp: 120 })
    expect(t.level).toBe(4)
  })

  it('keeps the last known level when a payload omits it', () => {
    let t = tallyAnswer(initialSessionTally(), {
      correct: true,
      gamification: { level: 7 },
    })
    t = tallyAnswer(t, { correct: false })
    expect(t.level).toBe(7)
  })
})

describe('sessionMessageInput', () => {
  it('maps the tally onto the message contract', () => {
    const t = tallyAnswer(initialSessionTally(), {
      correct: true,
      gamification: { levelUp: true, level: 3 },
    })
    expect(sessionMessageInput(t)).toEqual({
      correct: 1,
      total: 1,
      bestCombo: 1,
      levelUp: true,
      level: 3,
    })
  })
})

describe('sessionProgress', () => {
  it('is zero for an empty session', () => {
    expect(sessionProgress(0, 0)).toBe(0)
  })

  it('rounds positions to a percentage', () => {
    expect(sessionProgress(3, 10)).toBe(30)
    expect(sessionProgress(10, 10)).toBe(100)
  })
})
