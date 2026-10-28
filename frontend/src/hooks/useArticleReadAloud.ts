import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchReadAloudCapabilities,
  readAloudErrorCode,
  synthesizeReadAloud,
} from '@/api/readAloud'
import {
  BrowserSpeechPlayer,
  getSharedBrowserSpeechPlayer,
  isBrowserSpeechSupported,
  stopAllBrowserSpeech,
} from '@/utils/browserSpeech'
import {
  articlePlainText,
  buildSpeechUnits,
  chunkForPolly,
  detectSpeechLang,
  estimateListenMinutes,
  type SpeechLang,
} from '@/utils/speechText'

export type ReadAloudStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

const RATE_OPTIONS = [0.9, 1, 1.15, 1.25] as const
const RATE_STORAGE_KEY = 'aknews.readAloud.rate'

function readStoredRate(): number {
  const raw = localStorage.getItem(RATE_STORAGE_KEY)
  const n = raw ? Number(raw) : 1
  return RATE_OPTIONS.includes(n as (typeof RATE_OPTIONS)[number]) ? n : 1
}

type UseArticleReadAloudArgs = {
  title: string
  summary: string
  html: string
  language: SpeechLang
}

export function useArticleReadAloud({ title, summary, html, language }: UseArticleReadAloudArgs) {
  const plainText = useMemo(
    () => articlePlainText(title, summary, html),
    [title, summary, html],
  )
  const speechLang = useMemo(
    () => detectSpeechLang(plainText, language),
    [plainText, language],
  )
  const pollyChunks = useMemo(() => chunkForPolly(plainText), [plainText])
  const browserUnits = useMemo(() => buildSpeechUnits(plainText), [plainText])

  const [status, setStatus] = useState<ReadAloudStatus>('idle')
  const [rate, setRateState] = useState(readStoredRate)
  const [pollyAvailable, setPollyAvailable] = useState<boolean | null>(null)
  const [pollyReason, setPollyReason] = useState<string | null>(null)
  const [engine, setEngine] = useState<'polly' | 'browser' | null>(null)
  const [chunkIndex, setChunkIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const pollyIndexRef = useRef(0)
  const pollyCacheRef = useRef<Map<number, Blob>>(new Map())
  const abortedRef = useRef(false)
  const browserPlayerRef = useRef<BrowserSpeechPlayer>(getSharedBrowserSpeechPlayer())

  const totalSteps = engine === 'polly' ? pollyChunks.length : browserUnits.length
  const listenMinutes = estimateListenMinutes(plainText, rate)

  useEffect(() => {
    let active = true
    fetchReadAloudCapabilities()
      .then((cap) => {
        if (!active) return
        setPollyAvailable(cap.polly)
        setPollyReason(cap.polly_reason ?? null)
      })
      .catch(() => {
        if (active) {
          setPollyAvailable(false)
          setPollyReason('polly_unreachable')
        }
      })
    return () => {
      active = false
    }
  }, [])

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    pollyCacheRef.current.clear()
  }, [])

  const stop = useCallback(() => {
    abortedRef.current = true
    cleanupAudio()
    stopAllBrowserSpeech()
    pollyIndexRef.current = 0
    setChunkIndex(0)
    setStatus('idle')
    setEngine(null)
    setErrorMessage(null)
  }, [cleanupAudio])

  useEffect(() => () => stop(), [stop])

  useEffect(() => {
    if ((status !== 'playing' && status !== 'paused') || engine !== 'browser') return undefined
    const id = window.setInterval(() => {
      setChunkIndex(browserPlayerRef.current.progress.index)
    }, 350)
    return () => window.clearInterval(id)
  }, [status, engine])

  const setRate = useCallback(
    (next: number) => {
      setRateState(next)
      localStorage.setItem(RATE_STORAGE_KEY, String(next))
      if (audioRef.current) audioRef.current.playbackRate = next
      if (engine === 'browser' && status === 'playing') {
        browserPlayerRef.current.setRate(next)
      }
    },
    [engine, status],
  )

  const mapPollyError = useCallback(
    (code: string | null) => {
      if (code === 'invalid_aws_credentials') return 'invalidAwsCredentials'
      if (code === 'polly_access_denied') return 'pollyAccessDenied'
      if (code === 'not_configured') return 'teRequiresPolly'
      if (speechLang === 'te') return 'teRequiresPolly'
      return 'pollyFailed'
    },
    [speechLang],
  )

  const preloadPollyChunk = useCallback(
    async (index: number) => {
      if (pollyCacheRef.current.has(index)) return pollyCacheRef.current.get(index)!
      const text = pollyChunks[index]
      try {
        const blob = await synthesizeReadAloud(text, speechLang)
        pollyCacheRef.current.set(index, blob)
        return blob
      } catch (err) {
        throw new Error(mapPollyError(readAloudErrorCode(err)))
      }
    },
    [mapPollyError, pollyChunks, speechLang],
  )

  const playBrowser = useCallback(
    async (startIndex = 0) => {
      if (!isBrowserSpeechSupported()) {
        setStatus('error')
        setErrorMessage('notSupported')
        return
      }
      abortedRef.current = false
      cleanupAudio()
      setEngine('browser')
      setErrorMessage(null)
      setStatus('loading')

      const player = browserPlayerRef.current
      player.setCallbacks({
        onStart: () => {
          setStatus('playing')
          setChunkIndex(player.progress.index)
        },
        onEnd: () => stop(),
        onError: () => {
          setStatus('error')
          setErrorMessage('browserFailed')
        },
      })

      const voice = await player.prepare(browserUnits, speechLang, rate)
      if (!voice) {
        setStatus('error')
        setErrorMessage(speechLang === 'te' ? 'noTeluguVoice' : 'noVoice')
        return
      }
      player.speakFrom(startIndex)
    },
    [browserUnits, cleanupAudio, rate, speechLang, stop],
  )

  const playPollyFrom = useCallback(
    async (startIndex: number) => {
      abortedRef.current = false
      setEngine('polly')
      setStatus('loading')
      setErrorMessage(null)
      pollyIndexRef.current = startIndex
      setChunkIndex(startIndex)

      try {
        await preloadPollyChunk(startIndex)
        if (pollyChunks[startIndex + 1]) {
          preloadPollyChunk(startIndex + 1).catch(() => undefined)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : mapPollyError(readAloudErrorCode(err))
        if (speechLang !== 'te' && isBrowserSpeechSupported() && msg === 'pollyFailed') {
          await playBrowser(0)
          return
        }
        setStatus('error')
        setErrorMessage(msg || mapPollyError(null))
        return
      }

      const playIndex = async (index: number) => {
        if (abortedRef.current) return
        if (index >= pollyChunks.length) {
          stop()
          return
        }
        setChunkIndex(index)
        pollyIndexRef.current = index
        let blob: Blob
        try {
          blob = await preloadPollyChunk(index)
          if (pollyChunks[index + 1]) preloadPollyChunk(index + 1).catch(() => undefined)
        } catch (err) {
          const msg = err instanceof Error ? err.message : mapPollyError(readAloudErrorCode(err))
          if (speechLang !== 'te' && isBrowserSpeechSupported() && msg === 'pollyFailed') {
            await playBrowser(index)
            return
          }
          setStatus('error')
          setErrorMessage(msg || mapPollyError(null))
          return
        }

        cleanupAudio()
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        const audio = new Audio(url)
        audio.playbackRate = rate
        audioRef.current = audio

        audio.onended = () => {
          if (abortedRef.current) return
          playIndex(index + 1)
        }
        audio.onerror = () => {
          setStatus('error')
          setErrorMessage('pollyFailed')
        }

        setStatus('playing')
        try {
          await audio.play()
        } catch {
          setStatus('error')
          setErrorMessage('playBlocked')
        }
      }

      await playIndex(startIndex)
    },
    [cleanupAudio, mapPollyError, playBrowser, pollyChunks, preloadPollyChunk, rate, speechLang, stop],
  )

  const play = useCallback(async () => {
    if (!plainText.trim()) return
    stop()
    abortedRef.current = false
    // Telugu needs cloud Polly on most desktops; English can use device voice when Polly is off.
    if (speechLang === 'te' || pollyAvailable === true) {
      await playPollyFrom(0)
      return
    }
    await playBrowser(0)
  }, [plainText, playBrowser, playPollyFrom, pollyAvailable, speechLang, stop])

  const pause = useCallback(() => {
    if (engine === 'polly' && audioRef.current) {
      audioRef.current.pause()
      setStatus('paused')
      return
    }
    if (engine === 'browser') {
      browserPlayerRef.current.pause()
      setStatus('paused')
    }
  }, [engine])

  const resume = useCallback(() => {
    if (engine === 'polly' && audioRef.current) {
      audioRef.current.play().catch(() => setErrorMessage('playBlocked'))
      setStatus('playing')
      return
    }
    if (engine === 'browser') {
      browserPlayerRef.current.resume()
      setStatus('playing')
    }
  }, [engine])

  const skipNext = useCallback(() => {
    if (engine === 'browser') {
      const player = browserPlayerRef.current
      const { index, total } = player.progress
      if (total <= 1 || index >= total - 1) return
      player.skipNext()
      setChunkIndex(player.progress.index)
      setStatus('playing')
      return
    }
    if (engine === 'polly') {
      const next = pollyIndexRef.current + 1
      if (next >= pollyChunks.length) return
      if (audioRef.current) audioRef.current.pause()
      void playPollyFrom(next)
    }
  }, [engine, playPollyFrom, pollyChunks.length])

  const skipPrev = useCallback(() => {
    if (engine === 'browser') {
      const player = browserPlayerRef.current
      const { index, total } = player.progress
      if (total <= 1 || index <= 0) return
      player.skipPrev()
      setChunkIndex(player.progress.index)
      setStatus('playing')
      return
    }
    if (engine === 'polly') {
      const prev = pollyIndexRef.current - 1
      if (prev < 0) return
      if (audioRef.current) audioRef.current.pause()
      void playPollyFrom(prev)
    }
  }, [engine, playPollyFrom])

  const canUse =
    plainText.trim().length > 0 &&
    (pollyAvailable === true || isBrowserSpeechSupported() || speechLang === 'te')

  return {
    status,
    rate,
    rateOptions: RATE_OPTIONS,
    setRate,
    play,
    pause,
    resume,
    stop,
    skipNext,
    skipPrev,
    chunkIndex,
    totalSteps,
    listenMinutes,
    canUse,
    pollyAvailable,
    pollyReason,
    engine,
    errorMessage,
    speechLang,
  }
}
