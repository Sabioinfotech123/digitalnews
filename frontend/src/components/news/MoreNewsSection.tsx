import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './MoreNewsSection.scss'

interface MoreNewsSectionProps {
  articles: PublicNewsCardModel[]
}

export function MoreNewsSection({ articles }: MoreNewsSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  return (
    <section className="more-news" aria-label={t('news.moreNews')}>
      <SectionHeader title={t('news.moreNews')} moreLabel={t('news.viewAllNews')} moreTo="/news" />
      <div className="more-news__list">
        {articles.map((article) => (
          <article key={article.id} className="more-news__item">
            <Link to={`/news/${article.slug}`} className="more-news__link">
              <div
                className="more-news__thumb"
                style={{
                  backgroundImage: article.imageUrl
                    ? `url(${article.imageUrl})`
                    : article.accent,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="more-news__body">
                <span className="more-news__category">{article.category}</span>
                <h3 className="more-news__title">{article.title}</h3>
                <p className="more-news__excerpt">{article.excerpt}</p>
                <p className="more-news__meta">{article.publishedLabel}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
