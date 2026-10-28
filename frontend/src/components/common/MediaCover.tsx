import { useState } from 'react'
import { cn } from '@/utils/cn'
import './MediaCover.scss'

type MediaCoverProps = {
  src?: string | null
  /** Shown when there is no src or the image fails to load (e.g. S3 AccessDenied). */
  fallbackBackground?: string
  className?: string
  /** Dark gradient on top of the photo (news cards). */
  overlay?: boolean
  children?: React.ReactNode
}

export function MediaCover({
  src,
  fallbackBackground,
  className,
  overlay = false,
  children,
}: MediaCoverProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src?.trim()) && !failed

  return (
    <div
      className={cn('media-cover', className)}
      style={!showImage && fallbackBackground ? { background: fallbackBackground } : undefined}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          className="media-cover__img"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : null}
      {overlay && showImage ? <span className="media-cover__overlay" aria-hidden /> : null}
      {children}
    </div>
  )
}
