import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicBlogs } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import type { BlogItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import './BlogsPage.scss'

export function BlogsPage() {
  const { t, contentLanguage } = useLanguage()
  const [items, setItems] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)

  useDocumentTitle(`Blogs | ${BRAND.name}`)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchPublicBlogs({
          page: 1,
          page_size: 20,
          language: contentLanguage,
        })
        if (active) setItems(data.items)
      } catch {
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [contentLanguage])

  return (
    <main className="blogs-page">
      <div className="blogs-page__container">
        <h1 className="blogs-page__title">{t('admin.blogs')}</h1>
        {loading ? <AppLoader tip="Loading blogs…" /> : null}
        {!loading && !items.length ? (
          <p className="blogs-page__empty">No blogs published yet.</p>
        ) : null}
        <div className="blogs-page__grid">
          {items.map((item) => (
            <Link key={item.id} to={`/blogs/${item.slug}`} className="blogs-page__card">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="blogs-page__image" />
              ) : (
                <div className="blogs-page__image blogs-page__image--empty" />
              )}
              <div className="blogs-page__body">
                {item.category_name ? <span className="blogs-page__cat">{item.category_name}</span> : null}
                <h2 className="blogs-page__card-title">{item.title}</h2>
                <p className="blogs-page__excerpt">{stripHtml(item.short_description)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
