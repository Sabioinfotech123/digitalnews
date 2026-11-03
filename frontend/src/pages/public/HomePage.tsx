import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories, fetchPublicNews, fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { FeaturedNewsSection } from '@/components/news/FeaturedNewsSection'
import { HomeCategoryRailSection } from '@/components/news/HomeCategoryRailSection'
import { HomeHeadlinesSection } from '@/components/news/HomeHeadlinesSection'
import { HomeNewsHub } from '@/components/news/HomeNewsHub'
import { HomeSpotlightSection } from '@/components/news/HomeSpotlightSection'
import { HomeNewsSkeleton } from '@/components/news/HomeNewsSkeleton'
import { LatestNewsSection } from '@/components/news/LatestNewsSection'
import { MoreNewsSection } from '@/components/news/MoreNewsSection'
import { TrendingNewsSection } from '@/components/news/TrendingNewsSection'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ShortVideoCard } from '@/components/common/ShortVideoCard'
import { VideoCard } from '@/components/common/VideoCard'
import { SAMPLE_NEWS, sampleNewsByType } from '@/constants/sampleNews'
import type { Category, NewsType } from '@/types/content'
import { loadPublicShortCards } from '@/utils/loadPublicShorts'
import {
  attachCategorySlugs,
  buildHomeCategoryBlocks,
  pickHeadlineList,
} from '@/utils/homeSections'
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

const HOME_FEED_SIZE = 60
const HUB_MIN_UNIQUE = 5

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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const activeCategorySlugs = useMemo(
    () => new Set(categories.filter((c) => c.is_active).map((c) => c.slug)),
    [categories],
  )

  const stream = useMemo(
    () => mergeHomeNews(featured, latest, feed, trending, more),
    [featured, latest, feed, trending, more],
  )

  const featuredBlock = useMemo(() => featured.slice(0, 4), [featured])
  const latestGrid = useMemo(() => {
    const featuredIds = new Set(featuredBlock.map((a) => a.id))
    const source = latest.length ? latest : feed.filter((a) => !featuredIds.has(a.id))
    return source.slice(0, 8)
  }, [latest, feed, featuredBlock])

  // Prefer stories not already shown in Featured / Latest. With a small catalog, allow repeats so the hub
  // isn't empty, but keep Featured stories last so the hub lead never matches the Featured lead.
  const hubStream = useMemo(() => {
    const reserved = new Set([...featuredBlock, ...latestGrid].map((a) => a.id))
    const unique = stream.filter((a) => !reserved.has(a.id))
    if (unique.length >= HUB_MIN_UNIQUE) return unique.slice(0, 17)
    return mergeHomeNews(unique, latestGrid, stream).slice(0, 17)
  }, [stream, featuredBlock, latestGrid])

  const moreStrip = useMemo(() => {
    const used = new Set(hubStream.map((a) => a.id))
    const fromMore = more.filter((a) => !used.has(a.id))
    const fromStream = stream.filter((a) => !used.has(a.id)).slice(33)
    return mergeHomeNews(fromMore, fromStream).slice(0, 10)
  }, [hubStream, more, stream])

  // Small catalogs: allow the same story in multiple sections (like major news sites), so the home never looks empty.
  const categoryRails = useMemo(() => {
    const pool = feed.length ? feed : stream
    const blocks = buildHomeCategoryBlocks(pool, {
      maxBlocks: 4,
      minPerBlock: 1,
    })
    if (!activeCategorySlugs.size) return blocks
    const matched = blocks.filter((block) => activeCategorySlugs.has(block.categorySlug))
    return matched.length ? matched : blocks
  }, [feed, stream, activeCategorySlugs])

  const headlineList = useMemo(() => {
    const pool = mergeHomeNews(trending, more, feed, stream)
    const picked = pickHeadlineList(pool, 8, new Set())
    return picked.length ? picked : pool.slice(0, 8)
  }, [trending, more, feed, stream])

  const spotlightList = useMemo(() => {
    const pool = mergeHomeNews(trending, more, featured, latest)
    return pool.slice(0, 4)
  }, [trending, more, featured, latest])

  const trendingDisplay = useMemo(() => {
    if (trending.length) return trending.slice(0, 10)
    return mergeHomeNews(latest, feed).slice(0, 8)
  }, [trending, latest, feed])

  const moreDisplay = useMemo(() => {
    if (moreStrip.length) return moreStrip
    return mergeHomeNews(more, feed).slice(0, 8)
  }, [moreStrip, more, feed])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const [
        cats,
        featuredItems,
        latestItems,
        trendingItems,
        moreItems,
        feedItems,
        videoList,
        shortList,
      ] = await Promise.all([
          fetchCategories().catch(() => []),
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
      setCategories(cats)
      const enrich = (list: PublicNewsCardModel[]) => attachCategorySlugs(list, cats)
      setFeatured(enrich(featuredItems))
      setLatest(enrich(latestItems))
      setTrending(enrich(trendingItems))
      setMore(enrich(moreItems))
      setFeed(enrich(feedItems))
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
            <FeaturedNewsSection articles={featuredBlock} />
            <HomeHeadlinesSection articles={headlineList} />
            {categoryRails.length ? (
              <div className="home__category-rails">
                {categoryRails.map((block) => (
                  <HomeCategoryRailSection key={block.categorySlug} block={block} />
                ))}
              </div>
            ) : null}
            <LatestNewsSection articles={latestGrid} dense />
            <HomeSpotlightSection articles={spotlightList} />
            <div className="home__split">
              <TrendingNewsSection articles={trendingDisplay} />
              <MoreNewsSection articles={moreDisplay} />
            </div>
          </>
        )}

        {shorts.length > 0 || videos.length > 0 ? (
          <div
            className={`home__media${
              shorts.length > 0 && videos.length > 0 && (shorts.length <= 3 || videos.length <= 2)
                ? ' home__media--paired'
                : ''
            }`}
          >
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
                  {shorts.length < 4 ? (
                    <Link to="/shorts" className="home__more-tile home__more-tile--short">
                      <i className="fa-solid fa-circle-play" aria-hidden />
                      <span>{t('videos.watchMoreShorts')}</span>
                    </Link>
                  ) : null}
                </div>
              </section>
            ) : null}

            {videos.length > 0 ? (
              <section className="home__section home__section--videos">
                <SectionHeader
                  title={t('videos.latestVideos')}
                  moreLabel={t('videos.viewAllVideos')}
                  moreTo="/videos"
                />
                <div className={`home__videos home__videos--count-${Math.min(videos.length, 4)}`}>
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}
