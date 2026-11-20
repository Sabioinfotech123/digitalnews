import { Link } from 'react-router-dom'
import { MediaCover } from '@/components/common/MediaCover'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import { cn } from '@/utils/cn'
import './FeaturedNewsSection.scss'

interface FeaturedNewsSectionProps {
  articles: PublicNewsCardModel[]
}

function FeaturedTile({ article, lead = false }: { article: PublicNewsCardModel; lead?: boolean }) {
  return (
    <article className={cn('featured-news__tile', lead && 'featured-news__tile--lead')}>
      <Link to={`/news/${article.slug}`} className="featured-news__link">
        <MediaCover
          className="featured-news__cover"
          src={article.imageUrl}
          fallbackBackground={article.accent}
        />
        <span className="featured-news__shade" aria-hidden />
        <div className="featured-news__copy">
          <span className="featured-news__cat">{article.category}</span>
          <h3 className="featured-news__title">{article.title}</h3>
          {lead && article.excerpt ? <p className="featured-news__excerpt">{article.excerpt}</p> : null}
          <p className="featured-news__meta">{article.publishedLabel}</p>
        </div>
      </Link>
    </article>
  )
}

export function FeaturedNewsSection({ articles }: FeaturedNewsSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  const [lead, ...side] = articles

  return (
    <section className="featured-news" aria-label={t('news.featuredNews')}>
      <div className="featured-news__head">
        <h2 className="featured-news__heading">
          <i className="fa-solid fa-star" aria-hidden />
          {t('news.featuredNews')}
        </h2>
        <Link to="/news" className="featured-news__more">
          {t('news.viewAllNews')}
          <i className="fa-solid fa-arrow-right" aria-hidden />
        </Link>
      </div>
      <div className={cn('featured-news__grid', !side.length && 'featured-news__grid--single')}>
        <FeaturedTile article={lead} lead />
        {side.length ? (
          <div className="featured-news__side">
            {side.slice(0, 3).map((article) => (
              <FeaturedTile key={article.id} article={article} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
