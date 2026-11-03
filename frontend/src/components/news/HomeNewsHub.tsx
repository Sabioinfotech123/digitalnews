import { Link } from 'react-router-dom'
import { MediaCover } from '@/components/common/MediaCover'
import { NewsCard } from '@/components/common/NewsCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { PublicNewsCardModel } from '@/utils/publicNews'
import './HomeNewsHub.scss'

interface HomeNewsHubProps {
  stream: PublicNewsCardModel[]
}

function MidStory({ article }: { article: PublicNewsCardModel }) {
  return (
    <article className="home-hub__mid-item">
      <Link to={`/news/${article.slug}`} className="home-hub__mid-link">
        <MediaCover
          className="home-hub__mid-thumb"
          src={article.imageUrl}
          fallbackBackground={article.accent}
        />
        <div className="home-hub__mid-copy">
          <span className="home-hub__cat">{article.category}</span>
          <h3 className="home-hub__mid-title">{article.title}</h3>
          <p className="home-hub__meta">{article.publishedLabel}</p>
        </div>
      </Link>
    </article>
  )
}

function HeadlineRow({ article }: { article: PublicNewsCardModel }) {
  return (
    <article className="home-hub__headline">
      <Link to={`/news/${article.slug}`} className="home-hub__headline-link">
        <span className="home-hub__cat">{article.category}</span>
        <h3 className="home-hub__headline-title">{article.title}</h3>
        <p className="home-hub__meta">{article.publishedLabel}</p>
      </Link>
    </article>
  )
}

export function HomeNewsHub({ stream }: HomeNewsHubProps) {
  const { t } = useLanguage()
  if (!stream.length) return null

  const lead = stream[0]
  const rest = stream.slice(1)
  const midCount = Math.min(6, Math.ceil(rest.length / 2))
  const mid = rest.slice(0, midCount)
  const headlines = rest.slice(midCount, midCount + 10)

  return (
    <section className="home-hub" aria-label={t('news.topStories')}>
      <SectionHeader title={t('news.topStories')} moreLabel={t('news.viewAllNews')} moreTo="/news" />
      <div className="home-hub__grid">
        <div className="home-hub__lead">
          {lead ? <NewsCard article={lead} featured from="/" /> : null}
        </div>
        {mid.length ? (
          <div className="home-hub__mid">
            {mid.map((article) => (
              <MidStory key={article.id} article={article} />
            ))}
          </div>
        ) : null}
        {headlines.length ? (
          <div className="home-hub__headlines">
            <h2 className="home-hub__headlines-label">{t('news.moreHeadlines')}</h2>
            {headlines.map((article) => (
              <HeadlineRow key={article.id} article={article} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
