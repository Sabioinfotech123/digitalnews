import { NewsCard } from '@/components/common/NewsCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './FeaturedNewsSection.scss'

interface FeaturedNewsSectionProps {
  articles: PublicNewsCardModel[]
}

export function FeaturedNewsSection({ articles }: FeaturedNewsSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  const [lead, ...side] = articles

  return (
    <section className="featured-news" aria-label={t('news.featuredNews')}>
      <SectionHeader title={t('news.featuredNews')} moreLabel={t('news.viewAllNews')} moreTo="/news" />
      <div className="featured-news__layout">
        <NewsCard article={lead} featured />
        {side.length > 0 ? (
          <div className="featured-news__side">
            {side.slice(0, 3).map((article) => (
              <NewsCard key={article.id} article={article} compact />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
