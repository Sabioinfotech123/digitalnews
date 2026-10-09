import { App, Pagination, Segmented } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { fetchBookmarks, removeBookmark } from '@/api/bookmarks'
import { useAuth } from '@/app/providers/AuthProvider'
import { useBookmarks } from '@/app/providers/BookmarksProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import type { BookmarkContentType, BookmarkItem } from '@/types/bookmark'
import { getApiErrorMessage } from '@/utils/apiError'
import './BookmarksPage.scss'

const TYPE_LABEL: Record<BookmarkContentType, string> = {
  news: 'News',
  blog: 'Blog',
  video: 'Video',
}

function detailPath(item: BookmarkItem): string {
  if (item.content_type === 'news') return `/news/${item.slug}`
  if (item.content_type === 'blog') return `/blogs/${item.slug}`
  return `/videos/${item.slug}`
}

function formatSavedAt(value: string, language: 'en' | 'te') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BookmarksPage() {
  const { t, contentLanguage } = useLanguage()
  const { message } = App.useApp()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { refreshBookmarks } = useBookmarks()

  const [filter, setFilter] = useState<'all' | BookmarkContentType>('all')
  const [items, setItems] = useState<BookmarkItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const data = await fetchBookmarks({
        page,
        page_size: pageSize,
        content_type: filter === 'all' ? undefined : filter,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load saved items'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filter, isAuthenticated, message, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const filterOptions = useMemo(
    () => [
      { label: t('bookmarks.filterAll'), value: 'all' as const },
      { label: t('bookmarks.filterNews'), value: 'news' as const },
      { label: t('bookmarks.filterBlogs'), value: 'blog' as const },
      { label: t('bookmarks.filterVideos'), value: 'video' as const },
    ],
    [t],
  )

  const handleRemove = async (item: BookmarkItem) => {
    try {
      await removeBookmark(item.content_type, item.content_id)
      message.success(t('bookmarks.removed'))
      await refreshBookmarks()
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, t('bookmarks.saveFailed')))
    }
  }

  if (authLoading) {
    return (
      <main className="bookmarks-page">
        <AppLoader tip={t('common.loading')} />
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/bookmarks' }} replace />
  }

  return (
    <main className="bookmarks-page">
      <div className="bookmarks-page__shell">
        <header className="bookmarks-page__head">
          <div>
            <h1 className="bookmarks-page__title">{t('bookmarks.title')}</h1>
            <p className="bookmarks-page__subtitle">{t('bookmarks.subtitle')}</p>
          </div>
        </header>

        <Segmented
          className="bookmarks-page__filters"
          value={filter}
          options={filterOptions}
          onChange={(value) => {
            setPage(1)
            setFilter(value as 'all' | BookmarkContentType)
          }}
        />

        {loading ? (
          <AppLoader tip={t('common.loading')} />
        ) : items.length === 0 ? (
          <div className="bookmarks-page__empty">
            <i className="fa-regular fa-bookmark" aria-hidden />
            <p>{t('bookmarks.empty')}</p>
            <AppButton type="primary" href="/news" className="btn-soft-primary">
              {t('bookmarks.browseNews')}
            </AppButton>
          </div>
        ) : (
          <>
            <ul className="bookmarks-page__grid">
              {items.map((item) => (
                <li key={item.id} className="bookmarks-page__card">
                  {item.is_available ? (
                    <Link to={detailPath(item)} className="bookmarks-page__link">
                      <div
                        className="bookmarks-page__media"
                        style={
                          item.image_url
                            ? {
                                backgroundImage: `linear-gradient(180deg, rgba(17,17,17,0.05), rgba(17,17,17,0.5)), url(${item.image_url})`,
                              }
                            : undefined
                        }
                      >
                        <span className="bookmarks-page__type">{TYPE_LABEL[item.content_type]}</span>
                      </div>
                      <div className="bookmarks-page__body">
                        <h2>{item.title}</h2>
                        {item.category_name ? (
                          <p className="bookmarks-page__cat">{item.category_name}</p>
                        ) : null}
                        <p className="bookmarks-page__date">
                          {t('bookmarks.savedOn')} {formatSavedAt(item.saved_at, contentLanguage)}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="bookmarks-page__unavailable">
                      <span className="bookmarks-page__type">{TYPE_LABEL[item.content_type]}</span>
                      <h2>{item.title}</h2>
                      <p>{t('bookmarks.unavailable')}</p>
                    </div>
                  )}
                  <AppButton
                    type="text"
                    danger
                    className="bookmarks-page__remove"
                    aria-label={t('bookmarks.removeLabel')}
                    icon={<i className="fa-solid fa-trash-can" aria-hidden />}
                    onClick={() => void handleRemove(item)}
                  />
                </li>
              ))}
            </ul>
            {total > pageSize ? (
              <div className="bookmarks-page__pager">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
                  onChange={(next) => setPage(next)}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}
