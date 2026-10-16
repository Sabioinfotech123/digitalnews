import { stripHtml } from '@/utils/publicNews'

export type SpeechLang = 'en' | 'te'

const TELUGU_RE = /[\u0C00-\u0C7F]/

/** Sentence boundaries — Latin + Telugu danda / double danda. */
const SENTENCE_SPLIT = /(?<=[.!?…])\s+|(?<=[।॥])\s+/

export function detectSpeechLang(text: string, fallback: SpeechLang): SpeechLang {
  if (TELUGU_RE.test(text)) return 'te'
  return fallback
}

export function articlePlainText(title: string, summary: string, html: string): string {
  const body = stripHtml(html)
  return [title, summary, body].filter(Boolean).join('. ').replace(/\s+/g, ' ').trim()
}

export function splitSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  return trimmed
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Split long sentences for browser TTS (Chrome stutters on huge utterances). */
export function splitLongSentence(sentence: string, maxLen = 180): string[] {
  if (sentence.length <= maxLen) return [sentence]
  const parts: string[] = []
  let rest = sentence
  while (rest.length > maxLen) {
    const slice = rest.slice(0, maxLen)
    const breakAt = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf(' '), 0)
    const cut = breakAt > 40 ? breakAt : maxLen
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts.filter(Boolean)
}

export function buildSpeechUnits(text: string): string[] {
  const units: string[] = []
  for (const sentence of splitSentences(text)) {
    units.push(...splitLongSentence(sentence))
  }
  return units
}

/** Chunks for Polly API (max ~2500 per request). */
export function chunkForPolly(text: string, maxLen = 1200): string[] {
  const sentences = splitSentences(text)
  const chunks: string[] = []
  let current = ''

  const flush = () => {
    if (current.trim()) chunks.push(current.trim())
    current = ''
  }

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence
    if (next.length <= maxLen) {
      current = next
      continue
    }
    flush()
    if (sentence.length <= maxLen) {
      current = sentence
    } else {
      for (const part of splitLongSentence(sentence, maxLen)) {
        chunks.push(part)
      }
    }
  }
  flush()
  return chunks
}

export function estimateListenMinutes(text: string, rate: number): number {
  const words = text.split(/\s+/).filter(Boolean).length
  const wpm = 155 * rate
  return Math.max(1, Math.ceil(words / wpm))
}
