import { Link } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { BRAND } from '@/config/brand'
import type { VideoItem } from '@/constants/sampleVideos'
import { cn } from '@/utils/cn'
import './LiveTvPlayer.scss'

interface LiveTvPlayerProps {
  playlist: VideoItem[]
  activeId?: string
  onSelect?: (video: VideoItem) => void
}

export function LiveTvPlayer({ playlist, activeId, onSelect }: LiveTvPlayerProps) {
  const { t, uiLanguage } = useLanguage()
  const active = playlist.find((v) => v.id === activeId) ?? playlist[0]
  const hasEmbed = Boolean(BRAND.liveStreamEmbedUrl)

  return (
    <section className="live-tv" aria-label={t('videos.liveTv')}>
      <div className="live-tv__player-wrap">
        <div className="live-tv__badge">
          <span className="live-tv__pulse" aria-hidden />
          {t('videos.liveNow')}
        </div>

        {hasEmbed ? (
          <iframe
            className="live-tv__iframe"
            src={BRAND.liveStreamEmbedUrl}
            title={t('videos.liveTv')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="live-tv__placeholder" style={{ background: active?.accent }}>
            <i className="fa-solid fa-tower-broadcast live-tv__icon" aria-hidden />
            <p className="live-tv__placeholder-title">{t('videos.liveTv')}</p>
            <p className="live-tv__placeholder-text">{t('videos.comingSoon')}</p>
            <p className="live-tv__now-playing">{active?.title[uiLanguage]}</p>
          </div>
        )}
      </div>

      <aside className="live-tv__sidebar">
        <div className="live-tv__sidebar-head">
          <h2>{t('videos.videosOfTheDay')}</h2>
          <Link to="/videos">{t('videos.viewAllVideos')}</Link>
        </div>
        <ul className="live-tv__list">
          {playlist.map((video) => {
            const isActive = video.id === active?.id
            return (
              <li key={video.id}>
                <button
                  type="button"
                  className={cn('live-tv__item', isActive && 'live-tv__item--active')}
                  onClick={() => onSelect?.(video)}
                >
                  <span className="live-tv__item-thumb" style={{ background: video.accent }}>
                    <i className="fa-solid fa-circle-play" aria-hidden />
                  </span>
                  <span className="live-tv__item-meta">
                    <span className="live-tv__item-title">{video.title[uiLanguage]}</span>
                    <span className="live-tv__item-sub">
                      {video.duration} · {video.category[uiLanguage]}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </section>
  )
}
