import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './TrendingNewsSection.scss'

interface TrendingNewsSectionProps {
  articles: PublicNewsCardModel[]
}

export function TrendingNewsSection({ articles }: TrendingNewsSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  return (
    <section className="trending-news" aria-label={t('news.trendingNews')}>
      <SectionHeader title={t('news.trendingNews')} moreLabel={t('news.viewAllNews')} moreTo="/news" />
      <ol className="trending-news__list">
        {articles.map((article, index) => (
          <li key={article.id} className="trending-news__item">
            <Link to={`/news/${article.slug}`} className="trending-news__link">
              <span className="trending-news__rank" aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="trending-news__copy">
                <span className="trending-news__category">{article.category}</span>
                <h3 className="trending-news__title">{article.title}</h3>
                <p className="trending-news__meta">{article.publishedLabel}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
