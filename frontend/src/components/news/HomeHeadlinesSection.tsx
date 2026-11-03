import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './HomeHeadlinesSection.scss'

interface HomeHeadlinesSectionProps {
  articles: PublicNewsCardModel[]
}

export function HomeHeadlinesSection({ articles }: HomeHeadlinesSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  return (
    <section className="home-headlines" aria-label={t('news.headlines')}>
      <SectionHeader title={t('news.headlines')} moreLabel={t('news.viewAllNews')} moreTo="/news" />
      <ul className="home-headlines__list">
        {articles.map((article) => (
          <li key={article.id} className="home-headlines__item">
            <Link to={`/news/${article.slug}`} className="home-headlines__link">
              <div className="home-headlines__top">
                <span className="home-headlines__cat">{article.category}</span>
                {article.isBreaking ? (
                  <span className="home-headlines__live">{t('news.breakingNews')}</span>
                ) : null}
              </div>
              <h3 className="home-headlines__title">{article.title}</h3>
              {article.excerpt ? <p className="home-headlines__excerpt">{article.excerpt}</p> : null}
              <p className="home-headlines__meta">{article.publishedLabel}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
