// Pronunciation for flashcards. Pre-rendered Kokoro clips are the primary
// source (identical on every device); the Web Speech API is a fallback.
// All browser access is function-scoped so importing in node (vitest) is safe.
import { useEffect, useState } from 'react'

const TIP_KEY = 'vocabvault:tts-tip-seen'
const AUDIO_BASE = '/audio'

// Shown when neither a clip nor a browser voice is available.
export const TTS_UNAVAILABLE_HINT = 'Pronunciation audio unavailable'

// ---------------------------------------------------------------- audio clips

let manifestPromise = null
const urlCache = new Map()

function slugify(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function loadManifest() {
  if (!manifestPromise) {
    manifestPromise =
      typeof fetch === 'function'
        ? fetch(`${AUDIO_BASE}/manifest.json`)
            .then((res) => (res.ok ? res.json() : {}))
            .catch(() => ({}))
        : Promise.resolve({})
  }
  return manifestPromise
}

// Resolve a word to its clip URL, honouring the manifest (needed for the few
// multi-word / hyphenated entries) with a slug fallback.
export async function audioUrlFor(word) {
  const key = (word ?? '').trim().toLowerCase()
  if (!key) return null
  if (urlCache.has(key)) return urlCache.get(key)
  const manifest = await loadManifest()
  const slug = manifest[key] || slugify(key)
  const url = `${AUDIO_BASE}/words/${slug}.mp3`
  urlCache.set(key, url)
  return url
}

let audioEl = null

function getAudio() {
  if (typeof Audio === 'undefined') return null
  if (!audioEl) audioEl = new Audio()
  return audioEl
}

// --------------------------------------------------------------- speech API

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

// speech-dispatcher + espeak-ng exposes every language crossed with ~100
// variants ("English (Caribbean)+Demonic") and lists Caribbean before
// America. Score candidates so a plain, standard English voice wins:
// en-US > en-GB > other en; drop variants and script oddities; prefer
// non-espeak engines (whose voices are not named "English (…)").
function scoreVoice(voice) {
  const lang = (voice.lang || '').toLowerCase().replace(/_/g, '-')
  const name = voice.name || ''
  if (!lang.startsWith('en')) return null
  if (lang === 'en-shaw' || /shavian|mandarin|\bcmn\b/i.test(name)) return null

  let score = lang === 'en-us' ? 30 : lang.startsWith('en-gb') ? 20 : 10
  if (name.includes('+')) score -= 100
  if (/^english \(/i.test(name)) score -= 1
  return score
}

function pickVoice(synth) {
  let best = null
  let bestScore = -Infinity
  for (const voice of listVoices(synth)) {
    const score = scoreVoice(voice)
    if (score !== null && score > bestScore) {
      bestScore = score
      best = voice
    }
  }
  return best
}

function speakWithSynth(word, { rate = 1, onError } = {}) {
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

// null while checking, then boolean. True when clips are shipped (the normal
// case) or, failing that, when the browser has a usable voice.
export function useTtsAvailable(timeoutMs = 1500) {
  const [available, setAvailable] = useState(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const manifest = await loadManifest()
      let ok = Object.keys(manifest).length > 0
      if (!ok) ok = await voicesAvailable(timeoutMs)
      if (alive) setAvailable(ok)
    })()
    return () => {
      alive = false
    }
  }, [timeoutMs])
  return available
}

// One-time nudge for the undetectable case: audio exists but output is muted.
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
  let stopped = false
  const audio = audioEl
  if (audio) {
    try {
      audio.pause()
      audio.currentTime = 0
      stopped = true
    } catch {
      /* ignore */
    }
  }
  const synth = getSynth()
  if (synth) {
    try {
      synth.cancel()
      stopped = true
    } catch {
      /* ignore */
    }
  }
  return stopped
}

export function speakWord(text, { rate = 1, onError } = {}) {
  const word = (text ?? '').trim()
  if (!word) return false

  const audio = getAudio()
  if (!audio) return speakWithSynth(word, { rate, onError })

  // Prefer the shipped clip; fall back to speechSynthesis if it cannot play.
  audioUrlFor(word)
    .then((url) => {
      if (!url) throw new Error('no clip')
      stopSpeaking()
      audio.onerror = () => speakWithSynth(word, { rate, onError })
      audio.src = url
      audio.playbackRate = rate
      return audio.play()
    })
    .catch(() => {
      speakWithSynth(word, { rate, onError })
    })
  return true
}
