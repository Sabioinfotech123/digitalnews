import { Link } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { VideoItem } from '@/constants/sampleVideos'
import { cn } from '@/utils/cn'
import './ShortVideoCard.scss'

interface ShortVideoCardProps {
  video: VideoItem
  className?: string
}

export function ShortVideoCard({ video, className = '' }: ShortVideoCardProps) {
  const { uiLanguage } = useLanguage()

  return (
    <article className={cn('short-card', className)}>
      <Link to={`/videos/${video.slug}`} className="short-card__link">
        <div className="short-card__thumb" style={{ background: video.accent }}>
          <span className="short-card__play" aria-hidden>
            <i className="fa-solid fa-play" />
          </span>
          <span className="short-card__duration">{video.duration}</span>
          <div className="short-card__overlay">
            <h3 className="short-card__title">{video.title[uiLanguage]}</h3>
          </div>
        </div>
      </Link>
    </article>
  )
}
