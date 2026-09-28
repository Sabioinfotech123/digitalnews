import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicBlogById, fetchPublicBlogBySlug, fetchPublicBlogs } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { RelatedFeed } from '@/components/common/RelatedFeed'
import { BRAND } from '@/config/brand'
import type { BlogItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import './NewsDetailPage.scss'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function formatDate(iso: string | null, language: 'en' | 'te'): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogDetailPage() {
  const { slug: param } = useParams()
  const { t, contentLanguage } = useLanguage()
  const [article, setArticle] = useState<BlogItem | null>(null)
  const [related, setRelated] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useDocumentTitle(article?.title ? `${article.title} | ${BRAND.name}` : `Blog | ${BRAND.name}`)

  useEffect(() => {
    if (!param) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const data = UUID_RE.test(param)
          ? await fetchPublicBlogById(param)
          : await fetchPublicBlogBySlug(param, contentLanguage)
        if (!active) return
        setArticle(data)

        try {
          const list = await fetchPublicBlogs({
            page: 1,
            page_size: 12,
            language: contentLanguage,
          })
          if (!active) return
          const sameCategory = data.category_id
            ? list.items.filter((row) => row.id !== data.id && row.category_id === data.category_id)
            : []
          const others = list.items.filter((row) => row.id !== data.id)
          const picked = (sameCategory.length >= 2 ? sameCategory : others).slice(0, 6)
          setRelated(picked)
        } catch {
          if (active) setRelated([])
        }
      } catch {
        if (!active) return
        setArticle(null)
        setRelated([])
        setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [param, contentLanguage])

  if (loading) {
    return (
      <main className="news-detail">
        <div className="news-detail__shell">
          <AppLoader tip={t('blogs.loadingArticle')} />
        </div>
      </main>
    )
  }

  if (notFound || !article) {
    return (
      <main className="news-detail">
        <div className="news-detail__shell">
          <p className="news-detail__empty">{t('blogs.articleNotFound')}</p>
          <Link to="/blogs" className="news-detail__back">
            ← {t('blogs.backToBlogs')}
          </Link>
        </div>
      </main>
    )
  }

  const excerpt = stripHtml(article.short_description)
  const published = formatDate(article.published_at || article.created_at, contentLanguage)

  return (
    <main className="news-detail">
      <div className="news-detail__shell">
        <Link to="/blogs" className="news-detail__back">
          ← {t('blogs.backToBlogs')}
        </Link>

        <div
          className={
            related.length > 0
              ? 'news-detail__layout news-detail__layout--with-aside'
              : 'news-detail__layout'
          }
        >
          <article className="news-detail__main">
            <div className="news-detail__meta">
              {article.category_name ? (
                <span className="news-detail__category">{article.category_name}</span>
              ) : null}
              {published ? (
                <time
                  className="news-detail__date"
                  dateTime={article.published_at || article.created_at || undefined}
                >
                  {published}
                </time>
              ) : null}
            </div>

            <h1 className="news-detail__title">{article.title}</h1>
            {excerpt ? <p className="news-detail__excerpt">{excerpt}</p> : null}

            {article.author_name ? (
              <p className="news-detail__author">
                {t('blogs.byAuthor')} {article.author_name}
              </p>
            ) : null}

            {article.image_url ? (
              <div className="news-detail__hero">
                <img
                  src={article.image_url}
                  alt={article.title}
                  onError={(e) => {
                    e.currentTarget.parentElement?.classList.add('news-detail__hero--hidden')
                  }}
                />
              </div>
            ) : null}

            <div
              className="news-detail__body"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            {article.tags.length > 0 ? (
              <ul className="news-detail__tags">
                {article.tags.map((tag) => (
                  <li key={tag.id}>{tag.name}</li>
                ))}
              </ul>
            ) : null}
          </article>

          {related.length > 0 ? (
            <aside className="news-detail__aside">
              <RelatedFeed
                title={t('blogs.relatedBlogs')}
                items={related}
                basePath="/blogs"
                moreLabel={t('blogs.allPosts')}
                moreTo="/blogs"
              />
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  )
}
