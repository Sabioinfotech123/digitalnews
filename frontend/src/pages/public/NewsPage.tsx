import { Pagination } from 'antd'
import { useEffect, useState } from 'react'
import { fetchPublicNews } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { NewsCard } from '@/components/common/NewsCard'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import { cn } from '@/utils/cn'
import { mapApiNewsToCard, type PublicNewsCardModel } from '@/utils/publicNews'

const PAGE_SIZE = 12
const VIEW_KEY = 'news-page-view'

type NewsViewMode = 'grid' | 'list'

function readStoredView(): NewsViewMode {
  try {
    const value = localStorage.getItem(VIEW_KEY)
    return value === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function NewsPage() {
  const { t, contentLanguage } = useLanguage()
  const [items, setItems] = useState<PublicNewsCardModel[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<NewsViewMode>(() => readStoredView())

  useDocumentTitle(`${t('navigation.news')} | ${BRAND.name}`)

  useEffect(() => {
    setPage(1)
  }, [contentLanguage])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // ignore
    }
  }, [view])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchPublicNews({
          page,
          page_size: PAGE_SIZE,
          language: contentLanguage,
        })
        if (!active) return
        setItems(data.items.map((item) => mapApiNewsToCard(item, contentLanguage)))
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
    <main className="mx-auto max-w-[1200px] px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 border-l-4 border-primary pl-3 font-heading text-ink text-[1.75rem]">
          {t('navigation.news')}
        </h1>

        <div className="view-toggle" role="group" aria-label={t('news.viewMode')}>
          <button
            type="button"
            className={cn('view-toggle__btn', view === 'grid' && 'view-toggle__btn--active')}
            aria-pressed={view === 'grid'}
            aria-label={t('news.viewGrid')}
            onClick={() => setView('grid')}
          >
            <i className="fa-solid fa-table-cells" aria-hidden />
          </button>
          <button
            type="button"
            className={cn('view-toggle__btn', view === 'list' && 'view-toggle__btn--active')}
            aria-pressed={view === 'list'}
            aria-label={t('news.viewList')}
            onClick={() => setView('list')}
          >
            <i className="fa-solid fa-list-ul" aria-hidden />
          </button>
        </div>
      </div>

      {loading ? <AppLoader tip={t('news.loadingList')} /> : null}

      {!loading && !items.length ? (
        <p className="m-0 font-ui text-ink-muted">{t('news.emptyList')}</p>
      ) : null}

      {!loading && items.length ? (
        <>
          <div
            className={cn(
              view === 'grid'
                ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col',
            )}
          >
            {items.map((article) => (
              <NewsCard key={article.id} article={article} list={view === 'list'} />
            ))}
          </div>

          {total > PAGE_SIZE ? (
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
        </>
      ) : null}
    </main>
  )
}
