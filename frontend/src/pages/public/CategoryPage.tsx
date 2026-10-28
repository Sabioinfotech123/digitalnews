import { Pagination } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCategories, fetchPublicBlogs, fetchPublicNews } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppLoader } from '@/components/common/AppLoader'
import { NewsCard } from '@/components/common/NewsCard'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import { BRAND } from '@/config/brand'
import type { BlogItem, Category } from '@/types/content'
import { mapApiNewsToCard, stripHtml, type PublicNewsCardModel } from '@/utils/publicNews'
import './CategoryPage.scss'

const NEWS_PAGE_SIZE = 12
const BLOG_LIMIT = 6

export function CategoryPage() {
  const { slug } = useParams()
  const { t, contentLanguage } = useLanguage()
  const [category, setCategory] = useState<Category | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [news, setNews] = useState<PublicNewsCardModel[]>([])
  const [newsTotal, setNewsTotal] = useState(0)
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const categoryPath = slug ? `/category/${slug}` : '/news'

  useDocumentTitle(
    category
      ? `${category.name} | ${BRAND.name}`
      : `${t('category.title')} | ${BRAND.name}`,
  )

  useEffect(() => {
    setPage(1)
  }, [contentLanguage, slug])

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const cats = await fetchCategories()
        const match = cats.find((row) => row.slug === slug && row.is_active)
        if (!match) {
          if (!active) return
          setCategory(null)
          setNotFound(true)
          setNews([])
          setBlogs([])
          return
        }
        if (!active) return
        setCategory(match)

        const [newsData, blogData] = await Promise.all([
          fetchPublicNews({
            page,
            page_size: NEWS_PAGE_SIZE,
            language: contentLanguage,
            category_id: match.id,
          }),
          fetchPublicBlogs({
            page: 1,
            page_size: BLOG_LIMIT,
            language: contentLanguage,
            category_id: match.id,
          }),
        ])
        if (!active) return
        setNews(newsData.items.map((item) => mapApiNewsToCard(item, contentLanguage)))
        setNewsTotal(newsData.total)
        setBlogs(blogData.items)
      } catch {
        if (!active) return
        setCategory(null)
        setNotFound(true)
        setNews([])
        setBlogs([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [contentLanguage, page, slug])

  const hasContent = useMemo(() => news.length > 0 || blogs.length > 0, [news.length, blogs.length])

  if (loading) {
    return (
      <main className="category-page mx-auto max-w-[1200px] px-5 py-8">
        <AppLoader tip={t('category.loading')} />
      </main>
    )
  }

  if (notFound || !category) {
    return (
      <main className="category-page mx-auto max-w-[1200px] px-5 py-8">
        <h1 className="category-page__title">{t('category.notFound')}</h1>
        <p className="category-page__empty">{t('category.notFoundHint')}</p>
        <Link to="/news" className="category-page__back">
          {t('navigation.news')}
        </Link>
      </main>
    )
  }

  return (
    <main className="category-page mx-auto max-w-[1200px] px-5 py-8">
      <header className="category-page__head">
        <h1 className="category-page__title">{category.name}</h1>
        {category.description ? (
          <p className="category-page__desc">{category.description}</p>
        ) : null}
      </header>

      {!hasContent ? (
        <p className="category-page__empty">{t('category.empty')}</p>
      ) : null}

      {news.length ? (
        <section className="category-page__section" aria-labelledby="category-news-heading">
          <h2 id="category-news-heading" className="category-page__section-title">
            {t('category.newsSection')}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} from={categoryPath} />
            ))}
          </div>
          {newsTotal > NEWS_PAGE_SIZE ? (
            <div className="category-page__pager">
              <Pagination
                current={page}
                pageSize={NEWS_PAGE_SIZE}
                total={newsTotal}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {blogs.length ? (
        <section className="category-page__section" aria-labelledby="category-blogs-heading">
          <h2 id="category-blogs-heading" className="category-page__section-title">
            {t('category.blogsSection')}
          </h2>
          <ul className="category-page__blog-list">
            {blogs.map((item) => (
              <li key={item.id}>
                <Link to={`/blogs/${item.slug}`} className="category-page__blog-card">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" loading="lazy" />
                  ) : (
                    <span className="category-page__blog-placeholder" aria-hidden>
                      <i className="fa-solid fa-pen-nib" />
                    </span>
                  )}
                  <div>
                    <h3>{item.title}</h3>
                    {item.short_description ? <p>{stripHtml(item.short_description)}</p> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/blogs" className="category-page__more">
            {t('category.allBlogs')}
          </Link>
        </section>
      ) : null}
    </main>
  )
}
