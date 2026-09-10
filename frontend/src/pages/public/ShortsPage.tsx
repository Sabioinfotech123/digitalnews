import { useLanguage } from '@/app/providers/LanguageProvider'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ShortVideoCard } from '@/components/common/ShortVideoCard'
import { YoutubeCta } from '@/components/common/YoutubeCta'
import { SAMPLE_VIDEOS } from '@/constants/sampleVideos'
import './ShortsPage.scss'

export function ShortsPage() {
  const { t } = useLanguage()
  const shorts = SAMPLE_VIDEOS.filter((v) => v.isShort)

  return (
    <main className="shorts-page">
      <div className="shorts-page__container">
        <SectionHeader title={t('videos.shortVideos')} moreLabel={t('videos.watchOnYoutube')} moreTo="/videos" />
        <div className="shorts-page__grid">
          {shorts.map((video) => (
            <ShortVideoCard key={video.id} video={video} />
          ))}
        </div>
        <YoutubeCta />
      </div>
    </main>
  )
}
