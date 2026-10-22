import { App, Drawer, Input } from 'antd'
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchVideoComments,
  fetchVideoEngagement,
  postVideoComment,
  toggleVideoLike,
  type VideoCommentItem,
  type VideoEngagement,
} from '@/api/videoEngagement'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { ShareModal } from '@/components/common/ShareModal'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { loadPublicShortVideos } from '@/utils/loadPublicShorts'
import { BRAND } from '@/config/brand'
import type { VideoItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import './ShortReelsPage.scss'

const SWIPE_MIN_PX = 48

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function engagementForVideo(video: VideoItem, engagement: VideoEngagement | null): VideoEngagement {
  if (engagement) return engagement
  return {
    like_count: 0,
    comment_count: 0,
    liked_by_visitor: false,
    allow_likes: video.short_allow_likes,
    allow_comments: video.short_allow_comments,
    allow_share: video.short_allow_share,
  }
}

type SlideProps = {
  video: VideoItem
  active: boolean
  engagement: VideoEngagement | null
  onLike: () => void
  onComment: () => void
  onShare: () => void
  likeBusy: boolean
}

function ReelSlide({ video, active, engagement, onLike, onComment, onShare, likeBusy }: SlideProps) {
  const { t } = useLanguage()
  const stats = engagementForVideo(video, engagement)
  const videoRef = useRef<HTMLVideoElement>(null)
  const src = video.video_url?.trim() || ''
  const poster = video.thumbnail_url?.trim() || undefined
  const excerpt = stripHtml(video.description)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (active) {
      void el.play().catch(() => undefined)
    } else {
      el.pause()
      el.currentTime = 0
    }
  }, [active])

  return (
    <section className="short-reels__slide" aria-hidden={!active}>
      <div className="short-reels__media">
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            playsInline
            loop
            muted={false}
            preload="metadata"
            controls={false}
            aria-label={video.title}
            onClick={() => {
              const el = videoRef.current
              if (!el) return
              if (el.paused) void el.play().catch(() => undefined)
              else el.pause()
            }}
          />
        ) : (
          <div className="short-reels__placeholder">{t('videos.noShortsYet')}</div>
        )}
        <div className="short-reels__gradient" aria-hidden />
        <div className="short-reels__caption">
          {video.category_name ? (
            <span className="short-reels__category">{video.category_name}</span>
          ) : null}
          <h1 className="short-reels__title">{video.title}</h1>
          {excerpt ? <p className="short-reels__desc">{excerpt}</p> : null}
        </div>

        <div className="short-reels__rail">
          {stats.allow_likes ? (
            <button
              type="button"
              className={`short-reels__action${stats.liked_by_visitor ? ' short-reels__action--active' : ''}`}
              onClick={onLike}
              disabled={likeBusy}
              aria-pressed={stats.liked_by_visitor}
            >
              <i className={`fa-${stats.liked_by_visitor ? 'solid' : 'regular'} fa-heart`} aria-hidden />
              <span>{formatCount(stats.like_count)}</span>
            </button>
          ) : null}
          {stats.allow_comments ? (
            <button type="button" className="short-reels__action" onClick={onComment}>
              <i className="fa-regular fa-comment-dots" aria-hidden />
              <span>{formatCount(stats.comment_count)}</span>
            </button>
          ) : null}
          {stats.allow_share ? (
            <button type="button" className="short-reels__action" onClick={onShare}>
              <i className="fa-solid fa-share-nodes" aria-hidden />
              <span>{t('shorts.share')}</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function ShortReelsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, contentLanguage } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const { message } = App.useApp()
  const [items, setItems] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [engagementBySlug, setEngagementBySlug] = useState<Record<string, VideoEngagement>>({})
  const [likeBusySlug, setLikeBusySlug] = useState<string | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsSlug, setCommentsSlug] = useState<string | null>(null)
  const [comments, setComments] = useState<VideoCommentItem[]>([])
  const [commentName, setCommentName] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const touchStartY = useRef<number | null>(null)

  const activeVideo = items[activeIndex] ?? null

  useDocumentTitle(
    activeVideo
      ? `${activeVideo.title} | ${t('navigation.shorts')} | ${BRAND.name}`
      : `${t('navigation.shorts')} | ${BRAND.name}`,
  )

  const loadEngagement = useCallback(
    async (videoSlug: string) => {
      try {
        const data = await fetchVideoEngagement(videoSlug, contentLanguage)
        setEngagementBySlug((prev) => ({ ...prev, [videoSlug]: data }))
      } catch {
        /* ignore */
      }
    },
    [contentLanguage],
  )

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!items.length) return
      setActiveIndex((current) => {
        const clamped = Math.max(0, Math.min(items.length - 1, nextIndex))
        if (clamped === current) return current
        const video = items[clamped]
        if (video) {
          void loadEngagement(video.slug)
          if (video.slug !== slug) {
            navigate(`/shorts/watch/${video.slug}`, { replace: true })
          }
        }
        return clamped
      })
    },
    [items, loadEngagement, navigate, slug],
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const data = await loadPublicShortVideos(contentLanguage, { page: 1, page_size: 50 })
      if (!active) return
      setItems(data.items)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [contentLanguage])

  useEffect(() => {
    if (!items.length) return
    const idx = slug ? items.findIndex((v) => v.slug === slug) : 0
    const next = idx >= 0 ? idx : 0
    setActiveIndex(next)
    void loadEngagement(items[next].slug)
  }, [items, slug, loadEngagement])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (commentsOpen || shareOpen) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        goToIndex(activeIndex + 1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        goToIndex(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, commentsOpen, shareOpen, goToIndex])

  const onTouchStart = (event: TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartY.current
    touchStartY.current = null
    if (start == null) return
    const endY = event.changedTouches[0]?.clientY
    if (endY == null) return
    const delta = start - endY
    if (Math.abs(delta) < SWIPE_MIN_PX) return
    if (delta > 0) goToIndex(activeIndex + 1)
    else goToIndex(activeIndex - 1)
  }

  const handleLike = async (videoSlug: string) => {
    setLikeBusySlug(videoSlug)
    try {
      const data = await toggleVideoLike(videoSlug, contentLanguage)
      setEngagementBySlug((prev) => ({ ...prev, [videoSlug]: data }))
    } catch {
      message.error(t('shorts.likeFailed'))
    } finally {
      setLikeBusySlug(null)
    }
  }

  const openComments = async (videoSlug: string) => {
    setCommentsSlug(videoSlug)
    setCommentsOpen(true)
    try {
      const list = await fetchVideoComments(videoSlug, contentLanguage)
      setComments(list)
    } catch {
      setComments([])
    }
  }

  const submitComment = async () => {
    if (!commentsSlug) return
    const body = commentBody.trim()
    const name = isAuthenticated
      ? (user?.full_name?.trim() || '')
      : commentName.trim()
    if (body.length < 1) {
      message.warning(t('shorts.commentRequiredBody'))
      return
    }
    if (name.length < 2) {
      message.warning(t('shorts.commentRequiredName'))
      return
    }
    setCommentSubmitting(true)
    try {
      await postVideoComment(commentsSlug, name, body, contentLanguage)
      setCommentBody('')
      if (!isAuthenticated) setCommentName('')
      const list = await fetchVideoComments(commentsSlug, contentLanguage)
      setComments(list)
      const eng = await fetchVideoEngagement(commentsSlug, contentLanguage)
      setEngagementBySlug((prev) => ({ ...prev, [commentsSlug]: eng }))
      message.success(t('shorts.commentPosted'))
    } catch {
      message.error(t('shorts.commentFailed'))
    } finally {
      setCommentSubmitting(false)
    }
  }

  const openShare = (video: VideoItem) => {
    setShareTitle(video.title)
    setShareOpen(true)
  }

  if (loading) {
    return (
      <main className="short-reels short-reels--loading">
        <AppLoader tip={t('videos.loadingVideos')} />
      </main>
    )
  }

  if (!items.length) {
    return (
      <main className="short-reels short-reels--empty">
        <Link to="/shorts" className="short-reels__close">
          <i className="fa-solid fa-xmark" aria-hidden />
        </Link>
        <p>{t('videos.noShortsYet')}</p>
        <Link to="/shorts">{t('videos.back')}</Link>
      </main>
    )
  }

  const shareUrl =
    typeof window !== 'undefined' && activeVideo
      ? `${window.location.origin}/shorts/watch/${activeVideo.slug}`
      : ''

  const atFirst = activeIndex <= 0
  const atLast = activeIndex >= items.length - 1

  return (
    <main className="short-reels">
      <div
        className="short-reels__stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="short-reels__bundle">
          <div className="short-reels__viewport">
            <div className="short-reels__top">
              <Link to="/shorts" className="short-reels__close" aria-label={t('videos.back')}>
                <i className="fa-solid fa-xmark" aria-hidden />
              </Link>
              <span className="short-reels__brand">{t('navigation.shorts')}</span>
            </div>
            <div
              className="short-reels__track"
              style={{ transform: `translate3d(0, -${activeIndex * 100}%, 0)` }}
            >
            {items.map((video, index) => (
              <div key={video.id} className="short-reels__pane">
                <ReelSlide
                  video={video}
                  active={index === activeIndex}
                  engagement={engagementBySlug[video.slug] ?? null}
                  onLike={() => void handleLike(video.slug)}
                  onComment={() => void openComments(video.slug)}
                  onShare={() => openShare(video)}
                  likeBusy={likeBusySlug === video.slug}
                />
              </div>
            ))}
            </div>
          </div>

          <div className="short-reels__nav" aria-hidden={false}>
            <button
              type="button"
              className="short-reels__nav-btn"
              disabled={atFirst}
              aria-label={t('shorts.previousShort')}
              onClick={() => goToIndex(activeIndex - 1)}
            >
              <i className="fa-solid fa-chevron-up" aria-hidden />
            </button>
            <button
              type="button"
              className="short-reels__nav-btn"
              disabled={atLast}
              aria-label={t('shorts.nextShort')}
              onClick={() => goToIndex(activeIndex + 1)}
            >
              <i className="fa-solid fa-chevron-down" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <Drawer
        title={t('shorts.comments')}
        placement="bottom"
        height="min(520px, 78vh)"
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        className="short-reels__drawer"
      >
        <ul className="short-reels__comment-list">
          {comments.length === 0 ? (
            <li className="short-reels__comment-empty">{t('shorts.noComments')}</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="short-reels__comment">
                <strong>{c.author_name}</strong>
                <p>{c.body}</p>
              </li>
            ))
          )}
        </ul>
        <div className="short-reels__comment-form">
          {isAuthenticated && user ? (
            <p className="short-reels__comment-as">
              {t('shorts.commentingAs')} <strong>{user.full_name}</strong>
            </p>
          ) : (
            <Input
              placeholder={t('shorts.yourName')}
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              maxLength={120}
            />
          )}
          <Input.TextArea
            placeholder={t('shorts.addComment')}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <button
            type="button"
            className="short-reels__comment-submit"
            disabled={commentSubmitting}
            onClick={() => void submitComment()}
          >
            {t('shorts.postComment')}
          </button>
        </div>
      </Drawer>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={shareTitle} />
    </main>
  )
}
