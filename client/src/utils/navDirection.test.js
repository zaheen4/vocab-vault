import { describe, expect, it } from 'vitest'
import { consumeDirection, noteTabSwitch } from './navDirection.js'

const deck = '/decks/abc'
const quiz = '/decks/abc/quiz'
const typing = '/decks/abc/typing'

describe('tab-switch direction', () => {
  it('maps tab order to forward and back', () => {
    noteTabSwitch(deck, quiz)
    expect(consumeDirection()).toBe('forward')
    noteTabSwitch(typing, quiz)
    expect(consumeDirection()).toBe('back')
    noteTabSwitch(deck, typing)
    expect(consumeDirection()).toBe('forward')
  })

  it('yields null for same-tab, unknown, or unconsumed paths', () => {
    noteTabSwitch(quiz, quiz)
    expect(consumeDirection()).toBe(null)
    noteTabSwitch('/progress', quiz)
    expect(consumeDirection()).toBe(null)
    expect(consumeDirection()).toBe(null)
  })

  it('consumes once — a second read gets nothing', () => {
    noteTabSwitch(deck, quiz)
    expect(consumeDirection()).toBe('forward')
    expect(consumeDirection()).toBe(null)
  })
})
