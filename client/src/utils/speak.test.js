import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  claimTtsTip,
  isTtsSupported,
  speakWord,
  stopSpeaking,
  voicesAvailable,
} from './speak'

function installSpeech({ voices } = {}) {
  const synth = {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => voices ?? [{ lang: 'en-US', name: 'Mock En' }]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
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

describe('voicesAvailable', () => {
  it('resolves true when a voice is already listed', async () => {
    installSpeech()
    await expect(voicesAvailable()).resolves.toBe(true)
  })

  it('resolves false when the API is missing', async () => {
    await expect(voicesAvailable(10)).resolves.toBe(false)
  })

  it('resolves true once voiceschanged reports voices', async () => {
    const synth = installSpeech({ voices: [] })
    const listeners = {}
    synth.addEventListener = (name, fn) => {
      listeners[name] = fn
    }
    const pending = voicesAvailable(1000)
    synth.getVoices = () => [{ lang: 'en-US' }]
    listeners.voiceschanged()
    await expect(pending).resolves.toBe(true)
    expect(synth.removeEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function)
    )
  })

  it('resolves false on timeout when no voice ever appears', async () => {
    installSpeech({ voices: [] })
    await expect(voicesAvailable(10)).resolves.toBe(false)
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

  it('reports utterance failures through onError', () => {
    const synth = installSpeech()
    const onError = vi.fn()
    speakWord('abide', { onError })
    const utterance = synth.speak.mock.calls[0][0]
    utterance.onerror({ error: 'synthesis-failed' })
    expect(onError).toHaveBeenCalledWith('synthesis-failed')
  })
})

describe('voice ranking', () => {
  const speakAndPick = (voices) => {
    const synth = installSpeech({ voices })
    speakWord('abide')
    return synth.speak.mock.calls[0][0].voice
  }

  it('prefers en-US over the first-listed English voice', () => {
    const picked = speakAndPick([
      { lang: 'en-029', name: 'English (Caribbean)' },
      { lang: 'en-GB', name: 'English (Great Britain)' },
      { lang: 'en-US', name: 'English (America)' },
    ])
    expect(picked.name).toBe('English (America)')
  })

  it('skips espeak variant voices', () => {
    const picked = speakAndPick([
      { lang: 'en-US', name: 'English (America)+Demonic' },
      { lang: 'en-US', name: 'English (America)' },
    ])
    expect(picked.name).toBe('English (America)')
  })

  it('prefers a non-espeak en-US voice over espeak', () => {
    const picked = speakAndPick([
      { lang: 'en-US', name: 'English (America)' },
      { lang: 'en-US', name: 'RHVoice Alan' },
    ])
    expect(picked.name).toBe('RHVoice Alan')
  })

  it('falls back to another English voice when no en-US or en-GB', () => {
    const picked = speakAndPick([
      { lang: 'fr-FR', name: 'French' },
      { lang: 'en-029', name: 'English (Caribbean)' },
    ])
    expect(picked.name).toBe('English (Caribbean)')
  })

  it('uses a variant only when nothing better exists, never Shavian', () => {
    const picked = speakAndPick([
      { lang: 'en', name: 'English (Shavian alphabet)' },
      { lang: 'en-GB', name: 'English (Great Britain)+whisper' },
    ])
    expect(picked.name).toBe('English (Great Britain)+whisper')
  })

  it('leaves the voice unset when there is no English voice', () => {
    const picked = speakAndPick([
      { lang: 'fr-FR', name: 'French' },
      { lang: 'de-DE', name: 'German' },
    ])
    expect(picked).toBeUndefined()
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

describe('claimTtsTip', () => {
  it('fires once per browser', () => {
    const store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
    })
    expect(claimTtsTip()).toBe(true)
    expect(claimTtsTip()).toBe(false)
  })
})
