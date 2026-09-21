import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicBlogById, fetchPublicBlogBySlug } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import type { BlogItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import '../public/NewsDetailPage.scss'

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
  const { contentLanguage } = useLanguage()
  const [article, setArticle] = useState<BlogItem | null>(null)
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
      } catch {
        if (!active) return
        setArticle(null)
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
        <div className="news-detail__container">
          <AppLoader tip="Loading blog…" />
        </div>
      </main>
    )
  }

  if (notFound || !article) {
    return (
      <main className="news-detail">
        <div className="news-detail__container">
          <p className="news-detail__empty">Blog not found.</p>
          <Link to="/blogs" className="news-detail__back">
            ← Back to blogs
          </Link>
        </div>
      </main>
    )
  }

  const excerpt = stripHtml(article.short_description)
  const published = formatDate(article.published_at || article.created_at, contentLanguage)

  return (
    <main className="news-detail">
      <article className="news-detail__container">
        <Link to="/blogs" className="news-detail__back">
          ← Back to blogs
        </Link>

        <div className="news-detail__meta">
          {article.category_name ? (
            <span className="news-detail__category">{article.category_name}</span>
          ) : null}
          {published ? <time dateTime={article.published_at || article.created_at}>{published}</time> : null}
        </div>

        <h1 className="news-detail__title">{article.title}</h1>
        {excerpt ? <p className="news-detail__excerpt">{excerpt}</p> : null}

        {article.image_url ? (
          <img src={article.image_url} alt="" className="news-detail__hero" />
        ) : null}

        <div
          className="news-detail__content"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </article>
    </main>
  )
}
