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

function formatDate(iso: string | null, language: 'en' | 'te'): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function BlogCover({ src, className }: { src: string | null; className: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`${className} ${className}--empty`} aria-hidden>
        <i className="fa-solid fa-pen-nib" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function BlogMeta({
  item,
  language,
  byLabel,
}: {
  item: BlogItem
  language: 'en' | 'te'
  byLabel: string
}) {
  const date = formatDate(item.published_at || item.created_at, language)
  return (
    <div className="blogs-page__meta">
      {date ? <time dateTime={item.published_at || item.created_at || undefined}>{date}</time> : null}
      {item.author_name ? (
        <span>
          {byLabel} {item.author_name}
        </span>
      ) : null}
    </div>
  )
}

export function BlogsPage() {
  const { t, contentLanguage } = useLanguage()
  const [items, setItems] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)

  useDocumentTitle(`${t('blogs.title')} | ${BRAND.name}`)

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

  const [featured, ...rest] = items

  return (
    <main className="blogs-page">
      <div className="blogs-page__container">
        <header className="blogs-page__header">
          <div>
            <h1 className="blogs-page__title">{t('blogs.title')}</h1>
            <p className="blogs-page__subtitle">{t('blogs.subtitle')}</p>
          </div>
          {!loading && items.length > 0 ? (
            <p className="blogs-page__count">
              {items.length} {t('blogs.allPosts').toLowerCase()}
            </p>
          ) : null}
        </header>

        {loading ? <AppLoader tip={t('blogs.loadingList')} /> : null}

        {!loading && !items.length ? (
          <div className="blogs-page__empty">
            <span className="blogs-page__empty-icon" aria-hidden>
              <i className="fa-regular fa-newspaper" />
            </span>
            <p>{t('blogs.emptyList')}</p>
          </div>
        ) : null}

        {!loading && featured ? (
          <Link to={`/blogs/${featured.slug}`} className="blogs-page__featured">
            <div className="blogs-page__featured-media">
              <BlogCover src={featured.image_url} className="blogs-page__featured-image" />
            </div>
            <div className="blogs-page__featured-body">
              {featured.category_name ? (
                <span className="blogs-page__cat">{featured.category_name}</span>
              ) : null}
              <h2 className="blogs-page__featured-title">{featured.title}</h2>
              <p className="blogs-page__excerpt blogs-page__excerpt--lead">
                {stripHtml(featured.short_description)}
              </p>
              <div className="blogs-page__featured-foot">
                <BlogMeta item={featured} language={contentLanguage} byLabel={t('blogs.byAuthor')} />
                <span className="blogs-page__read">{t('blogs.readMore')}</span>
              </div>
            </div>
          </Link>
        ) : null}

        {!loading && rest.length > 0 ? (
          <section className="blogs-page__more" aria-label={t('blogs.allPosts')}>
            <div className="blogs-page__grid">
              {rest.map((item) => (
                <Link key={item.id} to={`/blogs/${item.slug}`} className="blogs-page__card">
                  <div className="blogs-page__media">
                    <BlogCover src={item.image_url} className="blogs-page__image" />
                  </div>
                  <div className="blogs-page__body">
                    {item.category_name ? (
                      <span className="blogs-page__cat">{item.category_name}</span>
                    ) : null}
                    <h2 className="blogs-page__card-title">{item.title}</h2>
                    <p className="blogs-page__excerpt">{stripHtml(item.short_description)}</p>
                    <BlogMeta item={item} language={contentLanguage} byLabel={t('blogs.byAuthor')} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
