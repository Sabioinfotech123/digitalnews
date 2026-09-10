import { Link, Navigate, useParams } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { BRAND } from '@/config/brand'
import { SAMPLE_VIDEOS } from '@/constants/sampleVideos'
import './VideoDetailPage.scss'

export function VideoDetailPage() {
  const { slug } = useParams()
  const { t, uiLanguage } = useLanguage()
  const video = SAMPLE_VIDEOS.find((item) => item.slug === slug)

  useDocumentTitle(video ? video.title[uiLanguage] : `Video | ${BRAND.name}`)

  if (!video) {
    return <Navigate to="/videos" replace />
  }

  const related = SAMPLE_VIDEOS.filter((item) => item.id !== video.id && !item.isShort).slice(0, 3)
  const sourceLabel =
    video.source === 'youtube'
      ? t('videos.youtube')
      : video.source === 'tv'
        ? t('videos.tvChannel')
        : t('videos.websiteUpload')

  return (
    <main className="video-detail">
      <div className="video-detail__container mx-auto max-w-[960px] px-5 py-6 pb-12">
        <div className="video-detail__player" style={{ background: video.accent }}>
          <i className="fa-solid fa-circle-play video-detail__play-icon" aria-hidden />
          <span className="video-detail__duration">{video.duration}</span>
        </div>

        <div className="video-detail__meta flex flex-wrap gap-2">
          <span className="video-detail__category">{video.category[uiLanguage]}</span>
          <span className="video-detail__source">{sourceLabel}</span>
        </div>
        <h1 className="video-detail__title font-heading text-ink">{video.title[uiLanguage]}</h1>
        <p className="video-detail__desc text-ink-muted">{video.description[uiLanguage]}</p>
        <p className="video-detail__time text-ink-muted">{video.publishedLabel[uiLanguage]}</p>

        <div className="video-detail__actions mt-5 flex flex-wrap gap-2.5">
          <AppButton
            type="primary"
            className="btn-soft-primary"
            icon={<i className="fa-solid fa-circle-play" aria-hidden />}
          >
            {t('videos.play')}
          </AppButton>
          <a href={BRAND.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
            <AppButton icon={<i className="fa-brands fa-youtube" aria-hidden />}>
              {t('videos.watchOnYoutube')}
            </AppButton>
          </a>
          <Link to="/live">
            <AppButton>{t('videos.watchLive')}</AppButton>
          </Link>
        </div>

        <section className="video-detail__related mt-10">
          <SectionHeader title={t('videos.relatedVideos')} moreLabel={t('videos.viewAllVideos')} moreTo="/videos" />
          <div className="video-detail__grid grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
