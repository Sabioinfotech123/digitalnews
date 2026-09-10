import { NewsCard } from '@/components/common/NewsCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './LatestNewsSection.scss'

interface LatestNewsSectionProps {
  articles: PublicNewsCardModel[]
}

export function LatestNewsSection({ articles }: LatestNewsSectionProps) {
  const { t } = useLanguage()
  if (!articles.length) return null

  return (
    <section className="latest-news" aria-label={t('news.latestNews')}>
      <SectionHeader title={t('news.latestNews')} moreLabel={t('news.viewAllNews')} moreTo="/news" />
      <div className="latest-news__grid">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
