import { useEffect, useState } from 'react'
import { fetchPublicNews, fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { FeaturedNewsSection } from '@/components/news/FeaturedNewsSection'
import { HomeNewsSkeleton } from '@/components/news/HomeNewsSkeleton'
import { LatestNewsSection } from '@/components/news/LatestNewsSection'
import { MoreNewsSection } from '@/components/news/MoreNewsSection'
import { TrendingNewsSection } from '@/components/news/TrendingNewsSection'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { sampleNewsByType } from '@/constants/sampleNews'
import type { NewsType } from '@/types/content'
import {
  mapApiNewsToCard,
  mapSampleNewsToCard,
  type PublicNewsCardModel,
} from '@/utils/publicNews'
import { mapApiVideoToCard, type PublicVideoCardModel } from '@/utils/publicVideo'
import './HomePage.scss'

const NEWS_TYPE_LIMITS: Record<NewsType, number> = {
  featured: 4,
  latest: 6,
  trending: 5,
  more: 4,
}

async function loadType(
  newsType: NewsType,
  language: 'en' | 'te',
): Promise<PublicNewsCardModel[]> {
  try {
    const data = await fetchPublicNews({
      news_type: newsType,
      language,
      page: 1,
      page_size: NEWS_TYPE_LIMITS[newsType],
    })
    return data.items.map((item) => mapApiNewsToCard(item, language))
  } catch {
    return sampleNewsByType(newsType)
      .slice(0, NEWS_TYPE_LIMITS[newsType])
      .map((item) => mapSampleNewsToCard(item, language))
  }
}

export function HomePage() {
  const { t, contentLanguage } = useLanguage()
  const [featured, setFeatured] = useState<PublicNewsCardModel[]>([])
  const [latest, setLatest] = useState<PublicNewsCardModel[]>([])
  const [trending, setTrending] = useState<PublicNewsCardModel[]>([])
  const [more, setMore] = useState<PublicNewsCardModel[]>([])
  const [videos, setVideos] = useState<PublicVideoCardModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const [featuredItems, latestItems, trendingItems, moreItems, videoList] = await Promise.all([
        loadType('featured', contentLanguage),
        loadType('latest', contentLanguage),
        loadType('trending', contentLanguage),
        loadType('more', contentLanguage),
        fetchPublicVideos({ page: 1, page_size: 2, language: contentLanguage })
          .then((data) => data.items.map((item) => mapApiVideoToCard(item, contentLanguage)))
          .catch(() => [] as PublicVideoCardModel[]),
      ])
      if (!active) return
      setFeatured(featuredItems)
      setLatest(latestItems)
      setTrending(trendingItems)
      setMore(moreItems)
      setVideos(videoList)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [contentLanguage])

  return (
    <main className="home">
      <div className="home__container">
        {loading ? (
          <HomeNewsSkeleton />
        ) : (
          <>
            <FeaturedNewsSection articles={featured} />
            <LatestNewsSection articles={latest} />

            <div className="home__split">
              <TrendingNewsSection articles={trending} />
              <MoreNewsSection articles={more} />
            </div>
          </>
        )}

        {videos.length > 0 ? (
          <section className="home__section">
            <SectionHeader
              title={t('videos.latestVideos')}
              moreLabel={t('videos.viewAllVideos')}
              moreTo="/videos"
            />
            <div className="home__videos">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
