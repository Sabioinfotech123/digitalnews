import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPublicVideoBySlug, fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { BRAND } from '@/config/brand'
import type { VideoItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import { mapApiVideoToCard, type PublicVideoCardModel } from '@/utils/publicVideo'
import { extractYoutubeId, youtubeWatchUrl } from '@/utils/youtube'
import './VideoDetailPage.scss'

function NativeVideoPlayer({
  src,
  poster,
  title,
}: {
  src: string
  poster?: string
  title: string
}) {
  return (
    <div className="video-detail__player video-detail__player--native">
      <video
        key={src}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        aria-label={title}
      >
        <track kind="captions" />
      </video>
    </div>
  )
}

export function VideoDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, contentLanguage } = useLanguage()
  const [video, setVideo] = useState<VideoItem | null>(null)
  const [related, setRelated] = useState<PublicVideoCardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const goBack = () => navigate(-1)

  useDocumentTitle(video ? `${video.title} | ${BRAND.name}` : `Video | ${BRAND.name}`)

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const [item, list] = await Promise.all([
          fetchPublicVideoBySlug(slug, contentLanguage),
          fetchPublicVideos({ page: 1, page_size: 4, language: contentLanguage }),
        ])
        if (!active) return
        setVideo(item)
        setRelated(
          list.items
            .filter((row) => row.id !== item.id)
            .slice(0, 3)
            .map((row) => mapApiVideoToCard(row, contentLanguage)),
        )
      } catch {
        if (!active) return
        setVideo(null)
        setRelated([])
        setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [slug, contentLanguage])

  if (loading) {
    return (
      <main className="video-detail">
        <div className="video-detail__container">
          <AppLoader tip={t('videos.loadingArticle')} />
        </div>
      </main>
    )
  }

  if (notFound || !video) {
    return (
      <main className="video-detail">
        <div className="video-detail__container">
          <p className="video-detail__empty">{t('videos.articleNotFound')}</p>
          <button type="button" className="video-detail__back" onClick={goBack}>
            ← {t('videos.back')}
          </button>
        </div>
      </main>
    )
  }

  const file = video.video_url?.trim() || null
  const yt = video.youtube_url?.trim() || null
  const thumb = video.thumbnail_url?.trim() || undefined
  const ytId = extractYoutubeId(yt)
  const watchHref = yt ? youtubeWatchUrl(yt) : null
  const excerpt = stripHtml(video.description)
  const sourceLabel =
    file && yt
      ? t('videos.websiteUpload')
      : yt
        ? t('videos.youtube')
        : t('videos.websiteUpload')

  return (
    <main className="video-detail">
      <div className="video-detail__container">
        <button type="button" className="video-detail__back" onClick={goBack}>
          ← {t('videos.back')}
        </button>

        <div className="video-detail__media">
          {file ? (
            <NativeVideoPlayer src={file} poster={thumb} title={video.title} />
          ) : ytId ? (
            <div className="video-detail__player video-detail__player--embed">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : null}

          {file && yt && watchHref ? (
            <a
              className="video-detail__yt-card"
              href={watchHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="video-detail__yt-icon" aria-hidden>
                <i className="fa-brands fa-youtube" />
              </span>
              <span className="video-detail__yt-copy">
                <span className="video-detail__yt-label">{t('videos.watchOnYoutube')}</span>
                <span className="video-detail__yt-title">{video.title}</span>
              </span>
              <span className="video-detail__yt-arrow" aria-hidden>
                <i className="fa-solid fa-arrow-up-right-from-square" />
              </span>
            </a>
          ) : null}
        </div>

        <div className="video-detail__meta">
          {video.category_name ? (
            <span className="video-detail__category">{video.category_name}</span>
          ) : null}
          <span className="video-detail__source">{sourceLabel}</span>
        </div>

        <h1 className="video-detail__title">{video.title}</h1>
        {excerpt ? <p className="video-detail__desc">{excerpt}</p> : null}

        {video.content ? (
          <div
            className="video-detail__body"
            dangerouslySetInnerHTML={{ __html: video.content }}
          />
        ) : null}

        {related.length > 0 ? (
          <section className="video-detail__related">
            <SectionHeader
              title={t('videos.relatedVideos')}
              moreLabel={t('videos.viewAllVideos')}
              moreTo="/videos"
            />
            <div className="video-detail__grid">
              {related.map((item) => (
                <VideoCard key={item.id} video={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
