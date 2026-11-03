import { Link } from 'react-router-dom'
import { MediaCover } from '@/components/common/MediaCover'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './HomeSpotlightSection.scss'

interface HomeSpotlightSectionProps {
  articles: PublicNewsCardModel[]
}

export function HomeSpotlightSection({ articles }: HomeSpotlightSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  return (
    <section className="home-spotlight" aria-label={t('news.inDepth')}>
      <div className="home-spotlight__head">
        <h2 className="home-spotlight__title">{t('news.inDepth')}</h2>
        <p className="home-spotlight__sub">{t('news.inDepthSub')}</p>
        <Link to="/news" className="home-spotlight__more">
          {t('news.viewAllNews')}
        </Link>
      </div>
      <div className="home-spotlight__grid">
        {articles.slice(0, 4).map((article) => (
          <article key={article.id} className="home-spotlight__card">
            <Link to={`/news/${article.slug}`} className="home-spotlight__link">
              <MediaCover
                className="home-spotlight__media"
                src={article.imageUrl}
                fallbackBackground={article.accent}
              />
              <div className="home-spotlight__body">
                <span className="home-spotlight__topic">{article.category}</span>
                <h3 className="home-spotlight__card-title">{article.title}</h3>
                <p className="home-spotlight__meta">{article.publishedLabel}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
