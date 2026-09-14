import { afterEach, describe, expect, it, vi } from 'vitest'

const MANIFEST = { abound: 'abound', 'stem from': 'stem-from' }

function stubAudio({ playRejects = false } = {}) {
  const instances = []
  class FakeAudio {
    constructor() {
      this.src = ''
      this.playbackRate = 1
      this.currentTime = 0
      this.onerror = null
      this.play = vi.fn(() =>
        playRejects ? Promise.reject(new Error('blocked')) : Promise.resolve()
      )
      this.pause = vi.fn()
      instances.push(this)
    }
  }
  vi.stubGlobal('Audio', FakeAudio)
  return instances
}

function stubFetch(manifest = MANIFEST) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) }))
  )
}

function stubSpeech() {
  const synth = {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => [{ lang: 'en-US', name: 'Mock En' }]),
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

async function freshSpeak() {
  vi.resetModules()
  return import('./speak')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pre-rendered audio', () => {
  it('plays the clip resolved from the manifest', async () => {
    const instances = stubAudio()
    stubFetch()
    const { speakWord } = await freshSpeak()

    expect(speakWord('abound')).toBe(true)
    await vi.waitFor(() =>
      expect(instances[0].src).toBe('/audio/words/abound.mp3')
    )
    expect(instances[0].play).toHaveBeenCalledTimes(1)
  })

  it('uses the manifest slug for multi-word entries', async () => {
    const instances = stubAudio()
    stubFetch()
    const { speakWord } = await freshSpeak()

    speakWord('stem from')
    await vi.waitFor(() =>
      expect(instances[0].src).toBe('/audio/words/stem-from.mp3')
    )
  })

  it('falls back to speechSynthesis when the clip cannot play', async () => {
    stubAudio({ playRejects: true })
    stubFetch()
    const synth = stubSpeech()
    const { speakWord } = await freshSpeak()

    speakWord('abound')
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1))
    expect(synth.speak.mock.calls[0][0].text).toBe('abound')
  })

  it('falls back to speechSynthesis when the clip 404s', async () => {
    const instances = stubAudio()
    stubFetch({}) // empty manifest -> slug fallback is fine, but audio error
    const synth = stubSpeech()
    const { speakWord } = await freshSpeak()

    speakWord('abound')
    await vi.waitFor(() => expect(instances[0].src).toBe('/audio/words/abound.mp3'))
    instances[0].onerror() // simulate decode/404 error
    expect(synth.speak).toHaveBeenCalledTimes(1)
  })

  it('pauses the clip and cancels the synth on stopSpeaking', async () => {
    const instances = stubAudio()
    stubFetch()
    const synth = stubSpeech()
    const { speakWord, stopSpeaking } = await freshSpeak()

    speakWord('abound')
    await vi.waitFor(() => expect(instances[0].play).toHaveBeenCalled())

    expect(stopSpeaking()).toBe(true)
    expect(instances[0].pause).toHaveBeenCalled()
    expect(synth.cancel).toHaveBeenCalled()
  })
})
