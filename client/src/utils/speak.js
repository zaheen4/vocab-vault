// Tiny Web Speech API wrapper for flashcard pronunciation.
// Frontend-only: no network, no backend. All browser access is
// function-scoped so this module is safe to import in node (vitest).
import { useEffect, useState } from 'react'

const TIP_KEY = 'vocabvault:tts-tip-seen'

// Shown when the browser exposes the API but reports no voices (e.g. Firefox
// on Linux without the speech-dispatcher daemon).
export const TTS_UNAVAILABLE_HINT = 'No speech voices in this browser'

function getSynth() {
  if (typeof window === 'undefined') return undefined
  const synth = window.speechSynthesis
  return typeof synth?.speak === 'function' ? synth : undefined
}

function getUtterance() {
  if (typeof SpeechSynthesisUtterance !== 'undefined') return SpeechSynthesisUtterance
  if (
    typeof window !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  ) {
    return window.SpeechSynthesisUtterance
  }
  return undefined
}

export function isTtsSupported() {
  return getSynth() !== undefined && getUtterance() !== undefined
}

function listVoices(synth) {
  try {
    return synth.getVoices?.() ?? []
  } catch {
    return []
  }
}

function pickVoice(synth) {
  return listVoices(synth).find((v) => v.lang?.toLowerCase().startsWith('en')) ?? null
}

// Voices load asynchronously in some engines, so "supported" is not the same
// as "can actually speak". Resolves true only once a voice is known.
export function voicesAvailable(timeoutMs = 1500) {
  if (!isTtsSupported()) return Promise.resolve(false)
  const synth = getSynth()
  if (listVoices(synth).length > 0) return Promise.resolve(true)

  return new Promise((resolve) => {
    let settled = false
    let timer = null
    const finish = (value) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      try {
        synth.removeEventListener?.('voiceschanged', onChange)
      } catch {
        /* engine quirks: ignore */
      }
      resolve(value)
    }
    const onChange = () => {
      if (listVoices(synth).length > 0) finish(true)
    }
    try {
      synth.addEventListener?.('voiceschanged', onChange)
    } catch {
      /* engine quirks: ignore */
    }
    timer = setTimeout(() => finish(listVoices(synth).length > 0), timeoutMs)
  })
}

// null while checking, then boolean. Keeps the speaker hidden until we know
// it can actually produce sound (avoids a dead button on Firefox Linux).
export function useTtsAvailable(timeoutMs = 1500) {
  const [available, setAvailable] = useState(null)
  useEffect(() => {
    let alive = true
    voicesAvailable(timeoutMs).then((value) => {
      if (alive) setAvailable(value)
    })
    return () => {
      alive = false
    }
  }, [timeoutMs])
  return available
}

// One-time nudge for the undetectable case: voices exist but output is muted.
// We cannot read system volume, so we ask the human to check it.
export function claimTtsTip() {
  try {
    if (typeof localStorage === 'undefined') return false
    if (localStorage.getItem(TIP_KEY)) return false
    localStorage.setItem(TIP_KEY, '1')
    return true
  } catch {
    return false
  }
}

export function stopSpeaking() {
  const synth = getSynth()
  if (!synth) return false
  try {
    synth.cancel()
  } catch {
    return false
  }
  return true
}

export function speakWord(text, { rate = 1, onError } = {}) {
  const word = (text ?? '').trim()
  if (!word) return false
  const synth = getSynth()
  const Utterance = getUtterance()
  if (!synth || !Utterance) return false
  try {
    synth.cancel()
    const utterance = new Utterance(word)
    utterance.lang = 'en-US'
    utterance.rate = rate
    const voice = pickVoice(synth)
    if (voice) utterance.voice = voice
    if (typeof onError === 'function') {
      utterance.onerror = (event) => onError(event?.error || 'synthesis-failed')
    }
    synth.speak(utterance)
  } catch {
    return false
  }
  return true
}
