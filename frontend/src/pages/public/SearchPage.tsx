import { Input } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchPublicBlogs, fetchPublicNews } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { NewsCard } from '@/components/common/NewsCard'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import type { BlogItem } from '@/types/content'
import { mapApiNewsToCard, stripHtml, type PublicNewsCardModel } from '@/utils/publicNews'
import './SearchPage.scss'

export function SearchPage() {
  const { t, contentLanguage } = useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = (params.get('q') || '').trim()

  const [draft, setDraft] = useState(query)
  const [news, setNews] = useState<PublicNewsCardModel[]>([])
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(false)

  useDocumentTitle(query ? `${t('common.searchTitle')}: ${query} | ${BRAND.name}` : `Search | ${BRAND.name}`)

  useEffect(() => {
    setDraft(query)
  }, [query])

  useEffect(() => {
    if (!query) {
      setNews([])
      setBlogs([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const [newsData, blogData] = await Promise.all([
          fetchPublicNews({
            page: 1,
            page_size: 24,
            search: query,
            language: contentLanguage,
          }),
          fetchPublicBlogs({
            page: 1,
            page_size: 24,
            search: query,
            language: contentLanguage,
          }),
        ])
        if (!active) return
        setNews(newsData.items.map((item) => mapApiNewsToCard(item, contentLanguage)))
        setBlogs(blogData.items)
      } catch {
        if (!active) return
        setNews([])
        setBlogs([])
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [query, contentLanguage])

  const submit = (value?: string) => {
    const next = (value ?? draft).trim()
    if (!next) {
      navigate('/search')
      return
    }
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  const empty = !loading && query && !news.length && !blogs.length

  return (
    <main className="search-page">
      <div className="search-page__container">
        <Link to="/" className="search-page__back">
          ← {t('common.backHome')}
        </Link>

        <h1 className="search-page__title">{t('common.searchTitle')}</h1>

        <form
          className="search-page__form"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Input
            allowClear
            size="large"
            value={draft}
            placeholder={t('common.searchPlaceholder')}
            prefix={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
            onChange={(e) => setDraft(e.target.value)}
            onPressEnter={() => submit()}
            className="search-page__input"
          />
        </form>

        {!query ? <p className="search-page__hint">{t('common.searchHint')}</p> : null}
        {query ? (
          <p className="search-page__meta">
            {t('common.searchResultsFor')} “{query}”
          </p>
        ) : null}

        {loading ? <AppLoader tip={t('common.loading')} /> : null}
        {empty ? <p className="search-page__empty">{t('common.searchEmpty')}</p> : null}

        {!loading && news.length ? (
          <section className="search-page__section">
            <h2 className="search-page__section-title">{t('common.searchNews')}</h2>
            <div className="search-page__news-grid">
              {news.map((article) => (
                <NewsCard key={article.id} article={article} compact />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && blogs.length ? (
          <section className="search-page__section">
            <h2 className="search-page__section-title">{t('common.searchBlogs')}</h2>
            <div className="search-page__blog-grid">
              {blogs.map((item) => (
                <Link key={item.id} to={`/blogs/${item.slug}`} className="search-page__blog-card">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="search-page__blog-image" />
                  ) : (
                    <div className="search-page__blog-image search-page__blog-image--empty" />
                  )}
                  <div className="search-page__blog-body">
                    {item.category_name ? (
                      <span className="search-page__blog-cat">{item.category_name}</span>
                    ) : null}
                    <h3 className="search-page__blog-title">{item.title}</h3>
                    <p className="search-page__blog-excerpt">{stripHtml(item.short_description)}</p>
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
