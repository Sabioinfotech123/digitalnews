import { useState } from 'react'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { LiveTvPlayer } from '@/components/common/LiveTvPlayer'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { YoutubeCta } from '@/components/common/YoutubeCta'
import { LIVE_PLAYLIST, SAMPLE_VIDEOS } from '@/constants/sampleVideos'
import './LivePage.scss'

export function LivePage() {
  const { t } = useLanguage()
  const [activeLiveId, setActiveLiveId] = useState(LIVE_PLAYLIST[0]?.id)
  const related = SAMPLE_VIDEOS.filter((v) => !v.isShort).slice(0, 3)

  return (
    <main className="live-page">
      <div className="live-page__container">
        <SectionHeader title={t('videos.liveTv')} moreLabel={t('videos.viewAllVideos')} moreTo="/videos" />
        <LiveTvPlayer
          playlist={LIVE_PLAYLIST}
          activeId={activeLiveId}
          onSelect={(video) => setActiveLiveId(video.id)}
        />
        <section>
          <SectionHeader title={t('videos.relatedVideos')} />
          <div className="live-page__grid">
            {related.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
        <YoutubeCta />
      </div>
    </main>
  )
}
