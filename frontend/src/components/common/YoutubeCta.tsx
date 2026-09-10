import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { BRAND } from '@/config/brand'
import './YoutubeCta.scss'

export function YoutubeCta() {
  const { t } = useLanguage()

  return (
    <aside className="yt-cta flex flex-wrap items-center gap-4 rounded-lg border border-primary/45 bg-ink px-5 py-5 text-paper shadow-card">
      <div
        className="yt-cta__icon grid size-12 shrink-0 place-items-center rounded-full bg-primary text-xl text-paper"
        aria-hidden
      >
        <i className="fa-brands fa-youtube" />
      </div>
      <div className="yt-cta__copy min-w-0 flex-1 basis-56">
        <h2 className="yt-cta__title m-0 font-heading text-lg font-bold text-paper">
          {t('videos.subscribeYoutube')}
        </h2>
        <p className="yt-cta__text mt-1.5 mb-0 text-sm text-white/70">
          {BRAND.name} — website uploads, YouTube channel & TV bulletins in one place.
        </p>
      </div>
      <a href={BRAND.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
        <AppButton type="primary" size="large" className="btn-soft-primary inline-flex items-center gap-2">
          <i className="fa-brands fa-youtube" aria-hidden />
          {t('videos.watchOnYoutube')}
        </AppButton>
      </a>
    </aside>
  )
}
