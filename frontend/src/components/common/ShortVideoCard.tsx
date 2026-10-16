import { Link } from 'react-router-dom'
import { MediaCover } from '@/components/common/MediaCover'
import type { PublicShortCardModel } from '@/utils/publicVideo'
import { cn } from '@/utils/cn'
import './ShortVideoCard.scss'

interface ShortVideoCardProps {
  video: PublicShortCardModel
  className?: string
}

export function ShortVideoCard({ video, className = '' }: ShortVideoCardProps) {
  return (
    <article className={cn('short-card', className)}>
      <Link to={`/videos/${video.slug}`} className="short-card__link">
        <MediaCover
          className="short-card__thumb"
          src={video.thumbnailUrl}
          fallbackBackground={video.accent}
          overlay
        >
          <span className="short-card__play" aria-hidden>
            <i className="fa-solid fa-play" />
          </span>
          <div className="short-card__overlay">
            <h3 className="short-card__title">{video.title}</h3>
          </div>
        </MediaCover>
      </Link>
    </article>
  )
}
