import { useEffect, useState } from 'react'
import { fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { LiveTvPlayer } from '@/components/common/LiveTvPlayer'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { YoutubeCta } from '@/components/common/YoutubeCta'
import { LIVE_PLAYLIST } from '@/constants/sampleVideos'
import { mapApiVideoToCard, type PublicVideoCardModel } from '@/utils/publicVideo'
import './LivePage.scss'

export function LivePage() {
  const { t, contentLanguage } = useLanguage()
  const [activeLiveId, setActiveLiveId] = useState(LIVE_PLAYLIST[0]?.id)
  const [related, setRelated] = useState<PublicVideoCardModel[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchPublicVideos({
          page: 1,
          page_size: 3,
          language: contentLanguage,
        })
        if (!active) return
        setRelated(data.items.map((item) => mapApiVideoToCard(item, contentLanguage)))
      } catch {
        if (!active) return
        setRelated([])
      }
    })()
    return () => {
      active = false
    }
  }, [contentLanguage])

  return (
    <main className="live-page">
      <div className="live-page__container">
        <SectionHeader title={t('videos.liveTv')} moreLabel={t('videos.viewAllVideos')} moreTo="/videos" />
        <LiveTvPlayer
          playlist={LIVE_PLAYLIST}
          activeId={activeLiveId}
          onSelect={(video) => setActiveLiveId(video.id)}
        />
        {related.length > 0 ? (
          <section>
            <SectionHeader title={t('videos.relatedVideos')} />
            <div className="live-page__grid">
              {related.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        ) : null}
        <YoutubeCta />
      </div>
    </main>
  )
}
