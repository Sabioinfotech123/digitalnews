import { Link } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { VideoItem } from '@/constants/sampleVideos'
import { cn } from '@/utils/cn'
import './VideoCard.scss'

interface VideoCardProps {
  video: VideoItem
  featured?: boolean
  className?: string
}

export function VideoCard({ video, featured = false, className = '' }: VideoCardProps) {
  const { uiLanguage, t } = useLanguage()
  const lang = uiLanguage

  const sourceLabel =
    video.source === 'youtube'
      ? t('videos.youtube')
      : video.source === 'tv'
        ? t('videos.tvChannel')
        : t('videos.websiteUpload')

  return (
    <article className={cn('video-card', featured && 'video-card--featured', className)}>
      <Link to={`/videos/${video.slug}`} className="video-card__link">
        <div className="video-card__thumb" style={{ background: video.accent }}>
          <span className="video-card__play" aria-hidden>
            <i className={featured ? 'fa-solid fa-circle-play' : 'fa-solid fa-play'} />
          </span>
          <span className="video-card__duration">{video.duration}</span>
          {video.source === 'youtube' && <span className="video-card__source">{sourceLabel}</span>}
        </div>
        <div className="video-card__body">
          <span className="video-card__category">{video.category[lang]}</span>
          <h3 className="video-card__title">{video.title[lang]}</h3>
          <p className="video-card__desc">{video.description[lang]}</p>
          <p className="video-card__meta">{video.publishedLabel[lang]}</p>
        </div>
      </Link>
    </article>
  )
}
