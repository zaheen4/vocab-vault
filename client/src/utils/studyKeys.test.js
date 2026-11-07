import { describe, expect, it } from 'vitest'
import { isControlTarget, isEditableTarget, resolveStudyKey } from './studyKeys.js'

const btn = { tagName: 'BUTTON' }
const link = { tagName: 'A' }
const input = { tagName: 'INPUT' }
const editable = { tagName: 'DIV', isContentEditable: true }

describe('resolveStudyKey', () => {
  it('flips on Space and Enter while the card is closed', () => {
    expect(resolveStudyKey({ key: ' ' })).toBe('flip')
    expect(resolveStudyKey({ key: 'Enter' })).toBe('flip')
  })

  it('answers with 1 and 2 only after the card is open', () => {
    expect(resolveStudyKey({ key: '1', flipped: true })).toBe('again')
    expect(resolveStudyKey({ key: '2', flipped: true })).toBe('got-it')
    expect(resolveStudyKey({ key: '1' })).toBeNull()
    expect(resolveStudyKey({ key: '2' })).toBeNull()
  })

  it('lets Enter submit Got it once the card is open', () => {
    expect(resolveStudyKey({ key: 'Enter', flipped: true })).toBe('got-it')
  })

  it('maps the letter shortcuts regardless of case', () => {
    expect(resolveStudyKey({ key: 's' })).toBe('speak')
    expect(resolveStudyKey({ key: 'R' })).toBe('reverse')
    expect(resolveStudyKey({ key: 'B', flipped: true })).toBe('bookmark')
  })

  it('does nothing while feedback is showing', () => {
    expect(resolveStudyKey({ key: ' ', hasFeedback: true })).toBeNull()
    expect(resolveStudyKey({ key: '1', flipped: true, hasFeedback: true })).toBeNull()
    expect(resolveStudyKey({ key: 'Enter', flipped: true, hasFeedback: true })).toBeNull()
  })

  it('never fires while typing in a field or a contenteditable', () => {
    for (const target of [input, editable]) {
      expect(resolveStudyKey({ key: '2', flipped: true, target })).toBeNull()
      expect(resolveStudyKey({ key: 's', target })).toBeNull()
    }
  })

  it('leaves Space and Enter to focused buttons and links', () => {
    for (const target of [btn, link]) {
      expect(resolveStudyKey({ key: ' ', target })).toBeNull()
      expect(resolveStudyKey({ key: 'Enter', target })).toBeNull()
      expect(resolveStudyKey({ key: '2', flipped: true, target })).toBe('got-it')
    }
  })

  it('respects the disabled flag and unknown keys', () => {
    expect(resolveStudyKey({ key: ' ', enabled: false })).toBeNull()
    expect(resolveStudyKey({ key: 'q' })).toBeNull()
    expect(resolveStudyKey({ key: '' })).toBeNull()
    expect(resolveStudyKey({})).toBeNull()
  })
})

describe('target helpers', () => {
  it('detects editable and native controls', () => {
    expect(isEditableTarget(input)).toBe(true)
    expect(isEditableTarget(editable)).toBe(true)
    expect(isEditableTarget(btn)).toBe(false)
    expect(isControlTarget(btn)).toBe(true)
    expect(isControlTarget(link)).toBe(true)
    expect(isControlTarget(input)).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
