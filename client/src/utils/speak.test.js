import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTtsSupported, speakWord, stopSpeaking } from './speak'

function installSpeech({ voices } = {}) {
  const synth = {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => voices ?? [{ lang: 'en-US', name: 'Mock En' }]),
  }
  vi.stubGlobal('window', { speechSynthesis: synth })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(text) {
        this.text = text
      }
    }
  )
  return synth
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isTtsSupported', () => {
  it('is false with no window (e.g. node)', () => {
    expect(isTtsSupported()).toBe(false)
  })

  it('is true when speechSynthesis and the constructor exist', () => {
    installSpeech()
    expect(isTtsSupported()).toBe(true)
  })
})

describe('speakWord', () => {
  it('returns false and never speaks when unsupported', () => {
    expect(speakWord('abide')).toBe(false)
  })

  it('returns false for blank text without touching the synth', () => {
    const synth = installSpeech()
    expect(speakWord('   ')).toBe(false)
    expect(synth.speak).not.toHaveBeenCalled()
    expect(synth.cancel).not.toHaveBeenCalled()
  })

  it('cancels before speaking, with text, lang and rate set', () => {
    const synth = installSpeech()
    expect(speakWord('abide')).toBe(true)
    expect(synth.cancel).toHaveBeenCalledTimes(1)
    expect(synth.speak).toHaveBeenCalledTimes(1)
    expect(synth.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      synth.speak.mock.invocationCallOrder[0]
    )
    const utterance = synth.speak.mock.calls[0][0]
    expect(utterance.text).toBe('abide')
    expect(utterance.lang).toBe('en-US')
    expect(utterance.rate).toBe(1)
  })

  it('prefers an English voice but speaks without one', () => {
    const synth = installSpeech({
      voices: [{ lang: 'fr-FR', name: 'Mock Fr' }, { lang: 'en-GB', name: 'Mock En' }],
    })
    speakWord('abide')
    expect(synth.speak.mock.calls[0][0].voice).toEqual({
      lang: 'en-GB',
      name: 'Mock En',
    })

    const bare = installSpeech({ voices: [] })
    expect(speakWord('abide')).toBe(true)
    expect(bare.speak.mock.calls[0][0].voice).toBeUndefined()
  })
})

describe('stopSpeaking', () => {
  it('cancels when supported and no-ops otherwise', () => {
    expect(stopSpeaking()).toBe(false)
    const synth = installSpeech()
    expect(stopSpeaking()).toBe(true)
    expect(synth.cancel).toHaveBeenCalledTimes(1)
  })
})
