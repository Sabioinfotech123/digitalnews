import { useLanguage } from '@/app/providers/LanguageProvider'
import { useArticleReadAloud } from '@/hooks/useArticleReadAloud'
import type { SpeechLang } from '@/utils/speechText'
import './ListenToArticle.scss'

type ListenToArticleProps = {
  title: string
  summary: string
  html: string
  language: SpeechLang
}

export function ListenToArticle({ title, summary, html, language }: ListenToArticleProps) {
  const { t } = useLanguage()
  const read = useArticleReadAloud({ title, summary, html, language })

  if (!read.canUse) {
    return null
  }

  const isActive = read.status === 'playing' || read.status === 'paused' || read.status === 'loading'
  const progressPct =
    read.totalSteps > 0 ? Math.min(100, ((read.chunkIndex + 1) / read.totalSteps) * 100) : 0

  const statusLabel =
    read.status === 'loading'
      ? t('speech.loading')
      : read.status === 'playing'
        ? t('speech.playing')
        : read.status === 'paused'
          ? t('speech.paused')
          : null

  const engineHint =
    read.engine === 'polly'
      ? t('speech.enginePolly')
      : read.engine === 'browser'
        ? t('speech.engineBrowser')
        : read.speechLang === 'te' || read.pollyAvailable
          ? t('speech.enginePolly')
          : t('speech.engineBrowser')

  const errKey = read.errorMessage
  const errText =
    errKey === 'notSupported'
      ? t('speech.notSupported')
      : errKey === 'noTeluguVoice'
        ? t('speech.noTeluguVoice')
        : errKey === 'teRequiresPolly'
          ? t('speech.teRequiresPolly')
          : errKey === 'invalidAwsCredentials'
            ? t('speech.invalidAwsCredentials')
            : errKey === 'pollyAccessDenied'
              ? t('speech.pollyAccessDenied')
              : errKey === 'noVoice'
          ? t('speech.noVoice')
          : errKey === 'pollyFailed'
            ? t('speech.pollyFailed')
            : errKey === 'browserFailed'
              ? t('speech.browserFailed')
              : errKey === 'playBlocked'
                ? t('speech.playBlocked')
                : null

  return (
    <section className="listen" aria-label={t('speech.listen')}>
      <div className="listen__head">
        <h2 className="listen__title">
          <i className="fa-solid fa-headphones" aria-hidden />
          {t('speech.listen')}
        </h2>
        <p className="listen__meta">
          ~{read.listenMinutes} {t('speech.minListen')} · {engineHint}
          {statusLabel ? ` · ${statusLabel}` : null}
        </p>
      </div>

      <div className="listen__controls">
        {!isActive ? (
          <button type="button" className="listen__btn listen__btn--primary" onClick={() => read.play()}>
            <i className="fa-solid fa-play" aria-hidden /> {t('speech.listen')}
          </button>
        ) : read.status === 'loading' ? (
          <button type="button" className="listen__btn listen__btn--primary" disabled>
            <i className="fa-solid fa-spinner fa-spin" aria-hidden /> {t('speech.loading')}
          </button>
        ) : read.status === 'paused' ? (
          <button type="button" className="listen__btn listen__btn--primary" onClick={() => read.resume()}>
            <i className="fa-solid fa-play" aria-hidden /> {t('speech.resume')}
          </button>
        ) : (
          <button type="button" className="listen__btn listen__btn--primary" onClick={() => read.pause()}>
            <i className="fa-solid fa-pause" aria-hidden /> {t('speech.pause')}
          </button>
        )}

        {isActive ? (
          <>
            <button
              type="button"
              className="listen__btn"
              onClick={() => read.skipPrev()}
              disabled={read.totalSteps <= 1 || read.chunkIndex <= 0}
              aria-label={t('speech.previous')}
            >
              <i className="fa-solid fa-backward-step" aria-hidden />
            </button>
            <button
              type="button"
              className="listen__btn"
              onClick={() => read.skipNext()}
              disabled={read.totalSteps <= 1 || read.chunkIndex >= read.totalSteps - 1}
              aria-label={t('speech.next')}
            >
              <i className="fa-solid fa-forward-step" aria-hidden />
            </button>
            <button type="button" className="listen__btn" onClick={() => read.stop()}>
              <i className="fa-solid fa-stop" aria-hidden /> {t('speech.stop')}
            </button>
          </>
        ) : null}

        <label className="listen__speed">
          {t('speech.speed')}
          <select
            value={read.rate}
            onChange={(e) => read.setRate(Number(e.target.value))}
            aria-label={t('speech.speed')}
          >
            {read.rateOptions.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>
      </div>

      {isActive && read.totalSteps > 1 ? (
        <div className="listen__progress" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="listen__progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      ) : null}

      {errText ? <p className="listen__error">{errText}</p> : null}
    </section>
  )
}
