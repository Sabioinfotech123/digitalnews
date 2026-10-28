import { App, Drawer, Input } from 'antd'
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  fetchVideoComments,
  fetchVideoEngagement,
  postVideoComment,
  reactVideoComment,
  toggleVideoLike,
  type CommentReaction,
  type VideoCommentItem,
  type VideoEngagement,
} from '@/api/videoEngagement'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { ShareModal } from '@/components/common/ShareModal'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { loadPublicShortVideos } from '@/utils/loadPublicShorts'
import type { SupportedLanguage } from '@/config/app'
import { BRAND } from '@/config/brand'
import type { VideoItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import './ShortReelsPage.scss'

const SWIPE_MIN_PX = 48

function commentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  }
  return name.trim().slice(0, 2).toUpperCase() || '?'
}

function formatCommentTime(iso: string, language: SupportedLanguage): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return language === 'te' ? 'ఇప్పుడే' : 'Just now'
  if (mins < 60) return language === 'te' ? `${mins} నిమిషాల క్రితం` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return language === 'te' ? `${hours} గంటల క్రితం` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return language === 'te' ? `${days} రోజుల క్రితం` : `${days}d ago`
  return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

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
  muted: boolean
  engagement: VideoEngagement | null
  onLike: () => void
  onComment: () => void
  onShare: () => void
  likeBusy: boolean
}

function ReelSlide({
  video,
  active,
  muted,
  engagement,
  onLike,
  onComment,
  onShare,
  likeBusy,
}: SlideProps) {
  const { t } = useLanguage()
  const stats = engagementForVideo(video, engagement)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [videoPaused, setVideoPaused] = useState(true)
  const [playbackHint, setPlaybackHint] = useState<'pause' | null>(null)
  const src = video.video_url?.trim() || ''
  const poster = video.thumbnail_url?.trim() || undefined
  const excerpt = stripHtml(video.description)

  const flashPauseHint = useCallback(() => {
    if (playbackHintTimer.current) clearTimeout(playbackHintTimer.current)
    setPlaybackHint('pause')
    playbackHintTimer.current = setTimeout(() => setPlaybackHint(null), 480)
  }, [])

  useEffect(
    () => () => {
      if (playbackHintTimer.current) clearTimeout(playbackHintTimer.current)
    },
    [],
  )

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = muted
  }, [muted])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (active) {
      void el.play().catch(() => undefined)
    } else {
      el.pause()
      el.currentTime = 0
      setVideoPaused(true)
      setPlaybackHint(null)
    }
  }, [active])

  const showCenterPlay = videoPaused && active
  const showCenterPause = playbackHint === 'pause' && active

  const togglePlayback = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => undefined)
    else el.pause()
  }

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
            muted={muted}
            preload="metadata"
            controls={false}
            aria-label={video.title}
            onClick={togglePlayback}
            onPlay={() => {
              setVideoPaused(false)
              flashPauseHint()
            }}
            onPause={() => {
              setVideoPaused(true)
              setPlaybackHint(null)
            }}
          />
        ) : (
          <div className="short-reels__placeholder">{t('videos.noShortsYet')}</div>
        )}
        {src && (showCenterPlay || showCenterPause) ? (
          <div
            className={`short-reels__playback${
              showCenterPause ? ' short-reels__playback--pause-flash' : ''
            }${showCenterPlay ? ' short-reels__playback--play' : ''}`}
            aria-hidden
          >
            <span className="short-reels__playback-icon">
              <i
                className={`fa-solid ${showCenterPlay ? 'fa-play' : 'fa-pause'}`}
                aria-hidden
              />
            </span>
          </div>
        ) : null}
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
  const location = useLocation()
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
  const [commentBody, setCommentBody] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentReactBusy, setCommentReactBusy] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [soundMuted, setSoundMuted] = useState(false)
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

  const goToLoginForComment = useCallback(() => {
    message.info(t('shorts.commentLoginRequired'))
    navigate('/login', { state: { from: location.pathname } })
  }, [location.pathname, message, navigate, t])

  const submitComment = async () => {
    if (!commentsSlug) return
    if (!isAuthenticated) {
      goToLoginForComment()
      return
    }
    const body = commentBody.trim()
    const name = user?.full_name?.trim() || ''
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

  const handleCommentReact = async (commentId: string, reaction: CommentReaction) => {
    if (!commentsSlug) return
    setCommentReactBusy(commentId)
    try {
      const updated = await reactVideoComment(commentsSlug, commentId, reaction)
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
    } catch {
      message.error(t('shorts.commentReactFailed'))
    } finally {
      setCommentReactBusy(null)
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
              <button
                type="button"
                className="short-reels__close short-reels__volume"
                aria-label={soundMuted ? t('shorts.unmute') : t('shorts.mute')}
                aria-pressed={soundMuted}
                onClick={() => setSoundMuted((m) => !m)}
              >
                <i
                  className={`fa-solid ${soundMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}
                  aria-hidden
                />
              </button>
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
                  muted={soundMuted}
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
        title={null}
        placement="bottom"
        height="min(560px, 82vh)"
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        className="short-reels-comments-drawer"
        closable={false}
        destroyOnClose
      >
        <div className="short-reels__comments-panel">
          <div className="short-reels__comments-handle" aria-hidden />
          <header className="short-reels__comments-head">
            <h2 className="short-reels__comments-title">{t('shorts.comments')}</h2>
            <button
              type="button"
              className="short-reels__comments-close"
              aria-label={t('videos.back')}
              onClick={() => setCommentsOpen(false)}
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          </header>

          <div className="short-reels__comments-scroll">
            {comments.length === 0 ? (
              <div className="short-reels__comments-empty">
                <i className="fa-regular fa-comment-dots" aria-hidden />
                <p>{t('shorts.noComments')}</p>
              </div>
            ) : (
              <ul className="short-reels__comment-list">
                {comments.map((c) => (
                  <li key={c.id} className="short-reels__comment">
                    <span className="short-reels__comment-avatar" aria-hidden>
                      {commentInitials(c.author_name)}
                    </span>
                    <div className="short-reels__comment-body">
                      <div className="short-reels__comment-meta">
                        <strong>{c.author_name}</strong>
                        <time dateTime={c.created_at}>
                          {formatCommentTime(c.created_at, contentLanguage)}
                        </time>
                      </div>
                      <p>{c.body}</p>
                      <div className="short-reels__comment-reactions">
                        <button
                          type="button"
                          className={`short-reels__comment-react${
                            c.viewer_reaction === 'like' ? ' short-reels__comment-react--active' : ''
                          }`}
                          aria-label={t('shorts.commentLike')}
                          aria-pressed={c.viewer_reaction === 'like'}
                          disabled={commentReactBusy === c.id}
                          onClick={() => void handleCommentReact(c.id, 'like')}
                        >
                          <i
                            className={
                              c.viewer_reaction === 'like'
                                ? 'fa-solid fa-thumbs-up'
                                : 'fa-regular fa-thumbs-up'
                            }
                            aria-hidden
                          />
                          {(c.like_count ?? 0) > 0 ? (
                            <span>{c.like_count}</span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          className={`short-reels__comment-react short-reels__comment-react--dislike${
                            c.viewer_reaction === 'dislike' ? ' short-reels__comment-react--active' : ''
                          }`}
                          aria-label={t('shorts.commentDislike')}
                          aria-pressed={c.viewer_reaction === 'dislike'}
                          disabled={commentReactBusy === c.id}
                          onClick={() => void handleCommentReact(c.id, 'dislike')}
                        >
                          <i
                            className={
                              c.viewer_reaction === 'dislike'
                                ? 'fa-solid fa-thumbs-down'
                                : 'fa-regular fa-thumbs-down'
                            }
                            aria-hidden
                          />
                          {(c.dislike_count ?? 0) > 0 ? (
                            <span>{c.dislike_count}</span>
                          ) : null}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="short-reels__comments-composer">
            {!isAuthenticated ? (
              <div className="short-reels__comment-login">
                <p className="short-reels__comment-login-hint">
                  <i className="fa-solid fa-lock" aria-hidden />
                  {t('shorts.commentLoginRequired')}
                </p>
                <AppButton
                  type="primary"
                  block
                  className="short-reels__comment-submit btn-soft-primary"
                  onClick={goToLoginForComment}
                >
                  {t('bookmarks.signIn')}
                </AppButton>
              </div>
            ) : (
              <>
                <div className="short-reels__comments-input-row">
                  {user ? (
                    <span className="short-reels__comment-avatar short-reels__comment-avatar--sm" aria-hidden>
                      {commentInitials(user.full_name)}
                    </span>
                  ) : null}
                  <Input.TextArea
                    className="short-reels__comments-text"
                    placeholder={t('shorts.addComment')}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={2000}
                  />
                </div>
                {user ? (
                  <p className="short-reels__comment-as">
                    {t('shorts.commentingAs')} <strong>{user.full_name}</strong>
                  </p>
                ) : null}
                <AppButton
                  type="primary"
                  block
                  className="short-reels__comment-submit btn-soft-primary"
                  loading={commentSubmitting}
                  onClick={() => void submitComment()}
                >
                  {t('shorts.postComment')}
                </AppButton>
              </>
            )}
          </footer>
        </div>
      </Drawer>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={shareTitle} />
    </main>
  )
}
