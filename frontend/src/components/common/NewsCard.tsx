import { Link } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import { cn } from '@/utils/cn'
import './NewsCard.scss'

interface NewsCardProps {
  article: PublicNewsCardModel
  featured?: boolean
  compact?: boolean
  /** One-per-row layout — used on /news list view only */
  list?: boolean
  className?: string
}

export function NewsCard({
  article,
  featured = false,
  compact = false,
  list = false,
  className = '',
}: NewsCardProps) {
  const { t } = useLanguage()

  return (
    <article
      className={cn(
        'news-card',
        featured && 'news-card--featured',
        compact && 'news-card--compact',
        list && 'news-card--list',
        className,
      )}
    >
      <Link to={`/news/${article.slug}`} className="news-card__link">
        <div
          className="news-card__media"
          style={{
            backgroundImage: article.imageUrl
              ? `linear-gradient(180deg, rgba(17,17,17,0.05), rgba(17,17,17,0.45)), url(${article.imageUrl})`
              : article.accent,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {article.isBreaking ? (
            <span className="news-card__badge">
              <i className="fa-solid fa-bolt" aria-hidden /> {t('news.breakingNews')}
            </span>
          ) : null}
        </div>
        <div className="news-card__body">
          <span className="news-card__category">{article.category}</span>
          <h3 className="news-card__title">{article.title}</h3>
          {!compact ? <p className="news-card__excerpt">{article.excerpt}</p> : null}
          <p className="news-card__meta">{article.publishedLabel}</p>
        </div>
      </Link>
    </article>
  )
}
