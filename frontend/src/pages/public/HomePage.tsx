import { useEffect, useMemo, useState } from 'react'
import { fetchPublicNews, fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { HomeNewsHub } from '@/components/news/HomeNewsHub'
import { HomeNewsSkeleton } from '@/components/news/HomeNewsSkeleton'
import { LatestNewsSection } from '@/components/news/LatestNewsSection'
import { MoreNewsSection } from '@/components/news/MoreNewsSection'
import { TrendingNewsSection } from '@/components/news/TrendingNewsSection'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ShortVideoCard } from '@/components/common/ShortVideoCard'
import { VideoCard } from '@/components/common/VideoCard'
import { SAMPLE_NEWS, sampleNewsByType } from '@/constants/sampleNews'
import type { NewsType } from '@/types/content'
import { loadPublicShortCards } from '@/utils/loadPublicShorts'
import { mergeHomeNews } from '@/utils/mergeHomeNews'
import {
  mapApiNewsToCard,
  mapSampleNewsToCard,
  type PublicNewsCardModel,
} from '@/utils/publicNews'
import {
  mapApiVideoToCard,
  type PublicShortCardModel,
  type PublicVideoCardModel,
} from '@/utils/publicVideo'
import './HomePage.scss'

const NEWS_TYPE_LIMITS: Record<NewsType, number> = {
  featured: 8,
  latest: 16,
  trending: 10,
  more: 12,
}

const HOME_FEED_SIZE = 40

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

async function loadPublishedFeed(language: 'en' | 'te'): Promise<PublicNewsCardModel[]> {
  try {
    const data = await fetchPublicNews({
      language,
      page: 1,
      page_size: HOME_FEED_SIZE,
    })
    return data.items.map((item) => mapApiNewsToCard(item, language))
  } catch {
    return SAMPLE_NEWS.map((item) => mapSampleNewsToCard(item, language))
  }
}

export function HomePage() {
  const { t, contentLanguage } = useLanguage()
  const [featured, setFeatured] = useState<PublicNewsCardModel[]>([])
  const [latest, setLatest] = useState<PublicNewsCardModel[]>([])
  const [trending, setTrending] = useState<PublicNewsCardModel[]>([])
  const [more, setMore] = useState<PublicNewsCardModel[]>([])
  const [feed, setFeed] = useState<PublicNewsCardModel[]>([])
  const [videos, setVideos] = useState<PublicVideoCardModel[]>([])
  const [shorts, setShorts] = useState<PublicShortCardModel[]>([])
  const [loading, setLoading] = useState(true)

  const stream = useMemo(
    () => mergeHomeNews(featured, latest, feed, trending, more),
    [featured, latest, feed, trending, more],
  )

  const hubStream = useMemo(() => stream.slice(0, 17), [stream])
  const latestGrid = useMemo(() => stream.slice(17, 33), [stream])
  const moreStrip = useMemo(() => {
    const used = new Set(hubStream.map((a) => a.id))
    const fromMore = more.filter((a) => !used.has(a.id))
    const fromStream = stream.filter((a) => !used.has(a.id)).slice(33)
    return mergeHomeNews(fromMore, fromStream).slice(0, 10)
  }, [hubStream, more, stream])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const [featuredItems, latestItems, trendingItems, moreItems, feedItems, videoList, shortList] =
        await Promise.all([
          loadType('featured', contentLanguage),
          loadType('latest', contentLanguage),
          loadType('trending', contentLanguage),
          loadType('more', contentLanguage),
          loadPublishedFeed(contentLanguage),
          fetchPublicVideos({ page: 1, page_size: 4, language: contentLanguage, is_short: false })
            .then((data) => data.items.map((item) => mapApiVideoToCard(item, contentLanguage)))
            .catch(() => [] as PublicVideoCardModel[]),
          loadPublicShortCards(contentLanguage, { page: 1, page_size: 8 }).then((data) => data.items),
        ])
      if (!active) return
      setFeatured(featuredItems)
      setLatest(latestItems)
      setTrending(trendingItems)
      setMore(moreItems)
      setFeed(feedItems)
      setVideos(videoList)
      setShorts(shortList)
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
            <HomeNewsHub stream={hubStream} />
            <LatestNewsSection articles={latestGrid} dense />
            <div className="home__split">
              <TrendingNewsSection articles={trending} />
              <MoreNewsSection articles={moreStrip} />
            </div>
          </>
        )}

        {shorts.length > 0 ? (
          <section className="home__section home__section--shorts">
            <SectionHeader
              title={t('videos.shortVideos')}
              moreLabel={t('navigation.shorts')}
              moreTo="/shorts"
            />
            <div className="home__shorts">
              {shorts.slice(0, 8).map((video) => (
                <ShortVideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        ) : null}

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
