// Tiny Web Speech API wrapper for flashcard pronunciation.
// Frontend-only: no network, no backend. All browser access is
// function-scoped so this module is safe to import in node (vitest).

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

function pickVoice(synth) {
  try {
    const voices = synth.getVoices?.() ?? []
    return voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ?? null
  } catch {
    return null
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

export function speakWord(text, { rate = 1 } = {}) {
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
    synth.speak(utterance)
  } catch {
    return false
  }
  return true
}
