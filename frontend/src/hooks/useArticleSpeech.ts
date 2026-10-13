import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildSpeechChunks,
  detectSpeechLang,
  htmlToParagraphs,
  isSpeechSupported,
  pickBestVoice,
  type SpeechLang,
} from '@/utils/speech'

export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'unavailable'

type Options = {
  title: string
  summary?: string | null
  html: string
  language: SpeechLang
}

/** Base rate per language; Telugu engines sound clearer slightly slower. */
const BASE_RATE: Record<SpeechLang, number> = { en: 1, te: 0.92 }

export function useArticleSpeech({ title, summary, html, language }: Options) {
  const supported = isSpeechSupported()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [status, setStatus] = useState<SpeechStatus>(supported ? 'idle' : 'unavailable')
  const [index, setIndex] = useState(0)
  const [speed, setSpeedState] = useState(1)

  const indexRef = useRef(0)
  const speedRef = useRef(1)
  const runRef = useRef(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const chunks = useMemo(() => {
    const paragraphs = [title, summary || '', ...htmlToParagraphs(html)].filter(Boolean)
    return buildSpeechChunks(paragraphs)
  }, [title, summary, html])

  const lang = useMemo(
    () => detectSpeechLang(`${title} ${chunks.slice(0, 3).join(' ')}`, language),
    [title, chunks, language],
  )

  const voice = useMemo(() => pickBestVoice(voices, lang), [voices, lang])

  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported])

  const cancelEngine = useCallback(() => {
    runRef.current += 1
    utteranceRef.current = null
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  const speakFrom = useCallback(
    (start: number) => {
      if (!supported || !voice) return
      cancelEngine()
      const runId = runRef.current

      const speakAt = (i: number) => {
        if (runId !== runRef.current) return
        if (i >= chunks.length) {
          utteranceRef.current = null
          indexRef.current = 0
          setIndex(0)
          setStatus('idle')
          return
        }
        indexRef.current = i
        setIndex(i)

        const utterance = new SpeechSynthesisUtterance(chunks[i])
        utterance.voice = voice
        utterance.lang = voice.lang
        utterance.rate = BASE_RATE[lang] * speedRef.current
        utterance.pitch = 1
        utterance.volume = 1
        utterance.onend = () => {
          if (runId !== runRef.current) return
          speakAt(i + 1)
        }
        utterance.onerror = (event) => {
          if (runId !== runRef.current) return
          if (event.error === 'interrupted' || event.error === 'canceled') return
          speakAt(i + 1)
        }
        // Keep a reference so Chrome doesn't garbage-collect it mid-speech (onend never fires).
        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
      }

      setStatus('playing')
      // Small delay after cancel() avoids Chrome dropping the first words.
      window.setTimeout(() => speakAt(start), 60)
    },
    [supported, voice, chunks, lang, cancelEngine],
  )

  const play = useCallback(() => {
    speakFrom(status === 'paused' ? indexRef.current : 0)
  }, [speakFrom, status])

  // Pause = stop the engine and remember the sentence; native pause() is unreliable on Android/Chrome.
  const pause = useCallback(() => {
    cancelEngine()
    setStatus('paused')
  }, [cancelEngine])

  const stop = useCallback(() => {
    cancelEngine()
    indexRef.current = 0
    setIndex(0)
    setStatus(supported ? 'idle' : 'unavailable')
  }, [cancelEngine, supported])

  const setSpeed = useCallback(
    (next: number) => {
      speedRef.current = next
      setSpeedState(next)
      if (status === 'playing') speakFrom(indexRef.current)
    },
    [speakFrom, status],
  )

  const skip = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(indexRef.current + delta, 0), Math.max(chunks.length - 1, 0))
      indexRef.current = next
      setIndex(next)
      if (status === 'playing') speakFrom(next)
    },
    [chunks.length, speakFrom, status],
  )

  useEffect(() => {
    stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, title])

  useEffect(() => () => cancelEngine(), [cancelEngine])

  return {
    supported,
    voiceReady: Boolean(voice),
    voicesLoaded: voices.length > 0,
    lang,
    status,
    index,
    total: chunks.length,
    speed,
    play,
    pause,
    stop,
    skip,
    setSpeed,
  }
}
