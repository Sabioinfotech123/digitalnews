import { useMemo, useState } from 'react'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { YoutubeCta } from '@/components/common/YoutubeCta'
import { SAMPLE_VIDEOS, type VideoSource } from '@/constants/sampleVideos'
import './VideosPage.scss'

type Filter = 'all' | VideoSource

export function VideosPage() {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<Filter>('all')

  const videos = useMemo(() => {
    const list = SAMPLE_VIDEOS.filter((v) => !v.isShort)
    if (filter === 'all') return list
    return list.filter((v) => v.source === filter)
  }, [filter])

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('videos.viewAllVideos') },
    { id: 'website', label: t('videos.websiteUpload') },
    { id: 'youtube', label: t('videos.youtube') },
    { id: 'tv', label: t('videos.tvChannel') },
  ]

  return (
    <main className="videos-page">
      <div className="videos-page__container">
        <SectionHeader title={t('videos.videoNews')} />
        <div className="videos-page__filters" role="tablist" aria-label={t('videos.videoNews')}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`videos-page__chip${filter === item.id ? ' videos-page__chip--active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="videos-page__grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        <YoutubeCta />
      </div>
    </main>
  )
}
