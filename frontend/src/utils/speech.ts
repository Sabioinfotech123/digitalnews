export type SpeechLang = 'en' | 'te'

const TELUGU_RE = /[\u0C00-\u0C7F]/
const MAX_CHUNK = 200

/** Voices that exist on macOS/Chrome but sound robotic or are novelty effects. */
const NOVELTY_VOICES =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy/i

const QUALITY_HINT = /natural|neural|online|premium|enhanced|google|siri/i

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function detectSpeechLang(text: string, fallback: SpeechLang): SpeechLang {
  if (TELUGU_RE.test(text)) return 'te'
  return fallback
}

function decodeEntities(value: string): string {
  if (typeof document === 'undefined') return value
  const el = document.createElement('textarea')
  el.innerHTML = value
  return el.value
}

/** Turn article HTML into readable paragraphs (block tags become breaks, links/URLs dropped). */
export function htmlToParagraphs(html: string): string[] {
  const withBreaks = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr|section|article)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(withBreaks)
    .split(/\n+/)
    .map(cleanSentenceText)
    .filter((line) => line.length > 1)
}

function cleanSentenceText(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/[•▪►●■◆★#*_~`|]+/g, ' ')
    .replace(/\s*([,;:])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX_CHUNK) return [sentence]
  const parts: string[] = []
  let rest = sentence
  while (rest.length > MAX_CHUNK) {
    const window = rest.slice(0, MAX_CHUNK)
    let cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(': '))
    if (cut < MAX_CHUNK * 0.4) cut = window.lastIndexOf(' ')
    if (cut <= 0) cut = MAX_CHUNK
    parts.push(rest.slice(0, cut + 1).trim())
    rest = rest.slice(cut + 1).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/**
 * Split into short, natural chunks. Chrome cuts off or stutters on long utterances,
 * so each chunk is one sentence (or a few short ones merged), never above MAX_CHUNK.
 */
export function buildSpeechChunks(paragraphs: string[]): string[] {
  const chunks: string[] = []
  for (const paragraph of paragraphs) {
    const sentences = paragraph
      .split(/(?<=[.!?।॥])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap(splitLong)

    let buffer = ''
    for (const sentence of sentences) {
      if (!buffer) {
        buffer = sentence
      } else if (buffer.length + sentence.length + 1 <= MAX_CHUNK && buffer.length < 80) {
        buffer = `${buffer} ${sentence}`
      } else {
        chunks.push(buffer)
        buffer = sentence
      }
    }
    if (buffer) {
      chunks.push(/[.!?।॥]$/.test(buffer) ? buffer : `${buffer}.`)
    }
  }
  return chunks
}

function voiceScore(voice: SpeechSynthesisVoice, lang: SpeechLang): number {
  const vLang = voice.lang.toLowerCase().replace('_', '-')
  let score = 0
  if (lang === 'te') {
    if (!vLang.startsWith('te')) return -1
    score += 50
  } else {
    if (!vLang.startsWith('en')) return -1
    if (vLang === 'en-in') score += 40
    else if (vLang === 'en-gb' || vLang === 'en-us') score += 30
    else score += 20
  }
  if (QUALITY_HINT.test(voice.name)) score += 25
  if (NOVELTY_VOICES.test(voice.name)) score -= 60
  if (voice.default) score += 3
  return score
}

export function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: SpeechLang,
): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -1
  for (const voice of voices) {
    const score = voiceScore(voice, lang)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return bestScore >= 0 ? best : null
}

export function estimateListenMinutes(text: string, rate: number): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / (150 * rate)))
}
