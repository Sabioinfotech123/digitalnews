import { Pagination } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { VideoCard } from '@/components/common/VideoCard'
import { YoutubeCta } from '@/components/common/YoutubeCta'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import { mapApiVideoToCard, type PublicVideoCardModel } from '@/utils/publicVideo'
import './VideosPage.scss'

const PAGE_SIZE = 12

type Filter = 'all' | 'website' | 'youtube'

export function VideosPage() {
  const { t, contentLanguage } = useLanguage()
  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<PublicVideoCardModel[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useDocumentTitle(`${t('videos.videoNews')} | ${BRAND.name}`)

  useEffect(() => {
    setPage(1)
  }, [contentLanguage])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchPublicVideos({
          page,
          page_size: PAGE_SIZE,
          language: contentLanguage,
        })
        if (!active) return
        setItems(data.items.map((item) => mapApiVideoToCard(item, contentLanguage)))
        setTotal(data.total)
      } catch {
        if (!active) return
        setItems([])
        setTotal(0)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [contentLanguage, page])

  const videos = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((v) => {
      if (filter === 'website') return v.source === 'website' || v.source === 'both'
      if (filter === 'youtube') return v.source === 'youtube' || v.source === 'both'
      return true
    })
  }, [filter, items])

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('videos.viewAllVideos') },
    { id: 'website', label: t('videos.websiteUpload') },
    { id: 'youtube', label: t('videos.youtube') },
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

        {loading ? (
          <AppLoader tip={t('videos.loadingList')} />
        ) : videos.length === 0 ? (
          <p className="videos-page__empty">{t('videos.emptyList')}</p>
        ) : (
          <div className="videos-page__grid">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {!loading && total > PAGE_SIZE ? (
          <div className="mt-8 flex justify-center">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        ) : null}

        <YoutubeCta />
      </div>
    </main>
  )
}
