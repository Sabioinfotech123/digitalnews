import { Pagination } from 'antd'
import { useEffect, useState } from 'react'
import { fetchPublicVideos } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ShortVideoCard } from '@/components/common/ShortVideoCard'
import { YoutubeCta } from '@/components/common/YoutubeCta'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import { mapApiVideoToShortCard, type PublicShortCardModel } from '@/utils/publicVideo'
import './ShortsPage.scss'

const PAGE_SIZE = 12

export function ShortsPage() {
  const { t, contentLanguage } = useLanguage()
  const [items, setItems] = useState<PublicShortCardModel[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useDocumentTitle(`${t('navigation.shorts')} | ${BRAND.name}`)

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
          is_short: true,
        })
        if (!active) return
        setItems(data.items.map((row) => mapApiVideoToShortCard(row, contentLanguage)))
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

  return (
    <main className="shorts-page">
      <div className="shorts-page__container">
        <SectionHeader
          title={t('videos.shortVideos')}
          moreLabel={t('videos.viewAllVideos')}
          moreTo="/videos"
        />
        {loading ? (
          <AppLoader tip={t('videos.loadingVideos')} />
        ) : items.length === 0 ? (
          <p className="shorts-page__empty">{t('videos.noShortsYet')}</p>
        ) : (
          <>
            <div className="shorts-page__grid">
              {items.map((video) => (
                <ShortVideoCard key={video.id} video={video} />
              ))}
            </div>
            {total > PAGE_SIZE ? (
              <Pagination
                className="shorts-page__pager"
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={setPage}
                showSizeChanger={false}
              />
            ) : null}
          </>
        )}
        <YoutubeCta />
      </div>
    </main>
  )
}
