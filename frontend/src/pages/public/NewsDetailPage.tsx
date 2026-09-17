import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchPublicNewsById, fetchPublicNewsBySlug } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import type { NewsItem } from '@/types/content'
import { stripHtml } from '@/utils/publicNews'
import './NewsDetailPage.scss'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type DetailLocationState = {
  from?: string
}

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

export function NewsDetailPage() {
  const { slug: param } = useParams()
  const location = useLocation()
  const { t, contentLanguage } = useLanguage()
  const [article, setArticle] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fromPath = (location.state as DetailLocationState | null)?.from
  const backToAllNews = fromPath === '/news'
  const backTo = backToAllNews ? '/news' : '/'
  const backLabel = backToAllNews ? t('news.backAllNews') : t('news.backHome')

  useDocumentTitle(article?.title ? `${article.title} | ${BRAND.name}` : `News | ${BRAND.name}`)

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
          ? await fetchPublicNewsById(param)
          : await fetchPublicNewsBySlug(param, contentLanguage)
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
          <AppLoader tip={t('news.loadingArticle')} />
        </div>
      </main>
    )
  }

  if (notFound || !article) {
    return (
      <main className="news-detail">
        <div className="news-detail__container">
          <p className="news-detail__empty">{t('news.articleNotFound')}</p>
          <Link to={backTo} className="news-detail__back">
            ← {backLabel}
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
        <Link to={backTo} className="news-detail__back">
          ← {backLabel}
        </Link>

        <div className="news-detail__meta">
          {article.category_name ? (
            <span className="news-detail__category">{article.category_name}</span>
          ) : null}
          {article.is_breaking ? (
            <span className="news-detail__breaking">{t('news.breakingNews')}</span>
          ) : null}
          {published ? <time className="news-detail__date">{published}</time> : null}
        </div>

        <h1 className="news-detail__title">{article.title}</h1>

        {excerpt ? <p className="news-detail__excerpt">{excerpt}</p> : null}

        {article.author_name ? (
          <p className="news-detail__author">
            {t('news.byAuthor')} {article.author_name}
          </p>
        ) : null}

        {article.image_url ? (
          <div className="news-detail__hero">
            <img src={article.image_url} alt={article.title} />
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
    </main>
  )
}
