import { App } from 'antd'
import { useMemo } from 'react'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { useArticleSpeech } from '@/hooks/useArticleSpeech'
import { estimateListenMinutes, htmlToParagraphs, type SpeechLang } from '@/utils/speech'
import './ListenToArticle.scss'

const SPEEDS = [0.75, 1, 1.25, 1.5]

type ListenToArticleProps = {
  title: string
  summary?: string | null
  html: string
  language: SpeechLang
}

export function ListenToArticle({ title, summary, html, language }: ListenToArticleProps) {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const speech = useArticleSpeech({ title, summary, html, language })

  const minutes = useMemo(
    () => estimateListenMinutes([title, summary || '', ...htmlToParagraphs(html)].join(' '), speech.speed),
    [title, summary, html, speech.speed],
  )

  if (!speech.supported) return null

  const active = speech.status === 'playing' || speech.status === 'paused'
  const progress = speech.total > 0 ? ((speech.index + (active ? 1 : 0)) / speech.total) * 100 : 0

  const handlePlay = () => {
    if (speech.voicesLoaded && !speech.voiceReady) {
      message.warning(speech.lang === 'te' ? t('speech.noTeluguVoice') : t('speech.noVoice'), 6)
      return
    }
    speech.play()
  }

  return (
    <div className={`listen${active ? ' listen--active' : ''}`}>
      {speech.status === 'playing' ? (
        <button type="button" className="listen__main" onClick={speech.pause} aria-label={t('speech.pause')}>
          <span className="listen__icon">
            <i className="fa-solid fa-pause" aria-hidden />
          </span>
          <span className="listen__copy">
            <span className="listen__label">{t('speech.playing')}</span>
            <span className="listen__wave" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </span>
          </span>
        </button>
      ) : (
        <button type="button" className="listen__main" onClick={handlePlay}>
          <span className="listen__icon">
            <i className="fa-solid fa-headphones" aria-hidden />
          </span>
          <span className="listen__copy">
            <span className="listen__label">
              {speech.status === 'paused' ? t('speech.resume') : t('speech.listen')}
            </span>
            <span className="listen__sub">
              {minutes} {t('speech.minListen')}
            </span>
          </span>
        </button>
      )}

      {active ? (
        <div className="listen__controls">
          <button
            type="button"
            className="listen__ctrl"
            onClick={() => speech.skip(-1)}
            aria-label={t('speech.previous')}
            title={t('speech.previous')}
          >
            <i className="fa-solid fa-backward-step" aria-hidden />
          </button>
          <button
            type="button"
            className="listen__ctrl"
            onClick={() => speech.skip(1)}
            aria-label={t('speech.next')}
            title={t('speech.next')}
          >
            <i className="fa-solid fa-forward-step" aria-hidden />
          </button>
          <button
            type="button"
            className="listen__ctrl"
            onClick={speech.stop}
            aria-label={t('speech.stop')}
            title={t('speech.stop')}
          >
            <i className="fa-solid fa-stop" aria-hidden />
          </button>
        </div>
      ) : null}

      <label className="listen__speed" title={t('speech.speed')}>
        <span className="sr-only">{t('speech.speed')}</span>
        <select value={speech.speed} onChange={(e) => speech.setSpeed(Number(e.target.value))}>
          {SPEEDS.map((value) => (
            <option key={value} value={value}>
              {value}x
            </option>
          ))}
        </select>
      </label>

      {active ? (
        <div className="listen__progress" aria-hidden>
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  )
}
