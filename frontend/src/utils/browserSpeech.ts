import type { SpeechLang } from '@/utils/speechText'

const NOVELTY_VOICES =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy/i

const QUALITY_HINT = /natural|neural|online|premium|enhanced|google|siri|microsoft/i

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function voiceScore(name: string, lang: SpeechLang): number {
  let score = 0
  if (QUALITY_HINT.test(name)) score += 40
  if (NOVELTY_VOICES.test(name)) score -= 100
  if (lang === 'te') {
    if (/telugu|te[-_]?in/i.test(name)) score += 50
    if (/kajal|mohan|shruti/i.test(name)) score += 30
  } else {
    if (/india|en-in|en_in/i.test(name)) score += 35
    if (/english/i.test(name) && !/india/i.test(name)) score += 10
  }
  return score
}

function langMatches(voice: SpeechSynthesisVoice, target: SpeechLang): boolean {
  const v = (voice.lang || '').toLowerCase()
  const name = voice.name.toLowerCase()
  if (target === 'te') {
    return (
      v.startsWith('te') ||
      v.includes('telugu') ||
      name.includes('telugu') ||
      /(?:mohan|shruti|kajal).*(?:natural|online)/i.test(voice.name)
    )
  }
  return v.startsWith('en') || name.includes('english')
}

export function waitForVoices(timeoutMs = 8000, lang?: SpeechLang): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isBrowserSpeechSupported()) {
      resolve([])
      return
    }
    const synth = window.speechSynthesis
    let best: SpeechSynthesisVoice[] = []

    const collect = () => {
      const list = synth.getVoices()
      if (list.length > best.length) best = list
      if (lang === 'te' && pickVoice(list, 'te')) return list
      if (lang !== 'te' && list.length > 0) return list
      return list
    }

    const existing = collect()
    if (lang === 'te' ? pickVoice(existing, 'te') : existing.length > 0) {
      resolve(existing)
      return
    }

    let done = false
    const finish = () => {
      if (done) return
      done = true
      synth.removeEventListener('voiceschanged', onChange)
      resolve(collect())
    }
    const onChange = () => finish()
    synth.addEventListener('voiceschanged', onChange)
    // Chrome loads voices lazily — nudge once
    synth.getVoices()
    window.setTimeout(finish, timeoutMs)
  })
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: SpeechLang): SpeechSynthesisVoice | null {
  const candidates = voices.filter((v) => langMatches(v, lang))
  if (!candidates.length) return null
  return [...candidates].sort((a, b) => voiceScore(b.name, lang) - voiceScore(a.name, lang))[0]
}

export function hasBrowserVoiceFor(lang: SpeechLang): boolean {
  if (!isBrowserSpeechSupported()) return false
  return pickVoice(window.speechSynthesis.getVoices(), lang) !== null
}

/** Chrome stops long sessions unless synthesis is nudged periodically. */
export function startSpeechKeepAlive(onTick?: () => void): () => void {
  if (!isBrowserSpeechSupported()) return () => undefined
  const synth = window.speechSynthesis
  const id = window.setInterval(() => {
    if (synth.speaking && !synth.paused) {
      synth.pause()
      synth.resume()
    }
    onTick?.()
  }, 9000)
  return () => window.clearInterval(id)
}

export type BrowserSpeechCallbacks = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (message: string) => void
}

export class BrowserSpeechPlayer {
  private units: string[] = []
  private index = 0
  private rate = 1
  private voice: SpeechSynthesisVoice | null = null
  private lang: SpeechLang = 'en'
  private stopKeepAlive: (() => void) | null = null
  private callbacks: BrowserSpeechCallbacks = {}
  private stopped = false
  private paused = false

  setCallbacks(callbacks: BrowserSpeechCallbacks) {
    this.callbacks = callbacks
  }

  async prepare(units: string[], lang: SpeechLang, rate: number) {
    this.units = units
    this.lang = lang
    this.rate = rate
    this.index = 0
    this.stopped = false
    this.paused = false
    const voices = await waitForVoices(8000, lang)
    this.voice = pickVoice(voices, lang)
    return this.voice
  }

  get progress(): { index: number; total: number } {
    return { index: this.index, total: this.units.length }
  }

  speakFrom(startIndex = 0) {
    if (!isBrowserSpeechSupported() || !this.units.length) return
    this.stopped = false
    this.paused = false
    this.index = Math.max(0, Math.min(startIndex, this.units.length - 1))
    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()
    this.stopKeepAlive?.()
    this.stopKeepAlive = startSpeechKeepAlive()
    this.callbacks.onStart?.()
    // Chrome may ignore speak() immediately after cancel while paused.
    window.setTimeout(() => {
      if (!this.stopped) this.speakCurrent()
    }, 0)
  }

  private speakCurrent() {
    if (this.stopped || this.index >= this.units.length) {
      this.finish()
      return
    }
    const utter = new SpeechSynthesisUtterance(this.units[this.index])
    utter.rate = this.rate
    utter.lang = this.lang === 'te' ? 'te-IN' : 'en-IN'
    if (this.voice) utter.voice = this.voice

    utter.onend = () => {
      if (this.stopped || this.paused) return
      this.index += 1
      this.speakCurrent()
    }
    utter.onerror = () => {
      this.callbacks.onError?.('Speech failed')
      this.finish()
    }
    window.speechSynthesis.speak(utter)
  }

  pause() {
    if (!isBrowserSpeechSupported()) return
    this.paused = true
    window.speechSynthesis.pause()
  }

  resume() {
    if (!isBrowserSpeechSupported()) return
    this.paused = false
    window.speechSynthesis.resume()
  }

  stop() {
    this.stopped = true
    this.paused = false
    if (isBrowserSpeechSupported()) window.speechSynthesis.cancel()
    this.stopKeepAlive?.()
    this.stopKeepAlive = null
    this.index = 0
  }

  skipNext() {
    if (!this.units.length || this.index >= this.units.length - 1) return
    this.speakFrom(this.index + 1)
  }

  skipPrev() {
    if (!this.units.length || this.index <= 0) return
    this.speakFrom(this.index - 1)
  }

  setRate(rate: number) {
    this.rate = rate
    if (window.speechSynthesis.speaking) {
      const idx = this.index
      window.speechSynthesis.cancel()
      this.speakFrom(idx)
    }
  }

  private finish() {
    this.stopKeepAlive?.()
    this.stopKeepAlive = null
    if (!this.stopped) this.callbacks.onEnd?.()
  }
}

/** Only one article should speak at a time site-wide. */
let activeBrowserPlayer: BrowserSpeechPlayer | null = null

export function getSharedBrowserSpeechPlayer(): BrowserSpeechPlayer {
  if (!activeBrowserPlayer) activeBrowserPlayer = new BrowserSpeechPlayer()
  return activeBrowserPlayer
}

export function stopAllBrowserSpeech() {
  activeBrowserPlayer?.stop()
}
