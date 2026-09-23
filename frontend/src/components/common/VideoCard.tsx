import { Link } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicVideoCardModel } from '@/utils/publicVideo'
import { cn } from '@/utils/cn'
import './VideoCard.scss'

interface VideoCardProps {
  video: PublicVideoCardModel
  featured?: boolean
  className?: string
}

export function VideoCard({ video, featured = false, className = '' }: VideoCardProps) {
  const { t } = useLanguage()

  const sourceLabel =
    video.source === 'youtube'
      ? t('videos.youtube')
      : video.source === 'both'
        ? t('videos.youtube')
        : t('videos.websiteUpload')

  return (
    <article className={cn('video-card', featured && 'video-card--featured', className)}>
      <Link to={`/videos/${video.slug}`} className="video-card__link">
        <div
          className="video-card__thumb"
          style={
            video.thumbnailUrl
              ? undefined
              : { background: video.accent }
          }
        >
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className="video-card__img" />
          ) : null}
          <span className="video-card__play" aria-hidden>
            <i className={featured ? 'fa-solid fa-circle-play' : 'fa-solid fa-play'} />
          </span>
          {(video.source === 'youtube' || video.source === 'both') && (
            <span className="video-card__source">{sourceLabel}</span>
          )}
        </div>
        <div className="video-card__body">
          <span className="video-card__category">{video.category}</span>
          <h3 className="video-card__title">{video.title}</h3>
          {video.description ? <p className="video-card__desc">{video.description}</p> : null}
          <p className="video-card__meta">{video.publishedLabel}</p>
        </div>
      </Link>
    </article>
  )
}
