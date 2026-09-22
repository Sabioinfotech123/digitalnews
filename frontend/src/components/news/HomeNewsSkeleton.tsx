import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import './HomeNewsSkeleton.scss'

function Bone({ className = '' }: { className?: string }) {
  return <span className={`home-skel__bone ${className}`.trim()} aria-hidden />
}

export function HomeNewsSkeleton() {
  const { t } = useLanguage()

  return (
    <div className="home-skel" aria-busy="true" aria-label={t('news.loadingList')}>
      <section className="home-skel__section">
        <SectionHeader title={t('news.featuredNews')} />
        <div className="home-skel__featured">
          <div className="home-skel__card home-skel__card--lead">
            <Bone className="home-skel__media home-skel__media--lead" />
            <Bone className="home-skel__line home-skel__line--cat" />
            <Bone className="home-skel__line home-skel__line--title" />
            <Bone className="home-skel__line home-skel__line--title-short" />
            <Bone className="home-skel__line home-skel__line--meta" />
          </div>
          <div className="home-skel__side">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="home-skel__compact">
                <Bone className="home-skel__thumb" />
                <div className="home-skel__compact-body">
                  <Bone className="home-skel__line home-skel__line--cat" />
                  <Bone className="home-skel__line home-skel__line--title" />
                  <Bone className="home-skel__line home-skel__line--meta" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-skel__section">
        <SectionHeader title={t('news.latestNews')} />
        <div className="home-skel__latest">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="home-skel__card">
              <Bone className="home-skel__media" />
              <Bone className="home-skel__line home-skel__line--cat" />
              <Bone className="home-skel__line home-skel__line--title" />
              <Bone className="home-skel__line home-skel__line--title-short" />
              <Bone className="home-skel__line home-skel__line--meta" />
            </div>
          ))}
        </div>
      </section>

      <div className="home-skel__split">
        <section className="home-skel__section">
          <SectionHeader title={t('news.trendingNews')} />
          <div className="home-skel__trending">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="home-skel__trend-row">
                <Bone className="home-skel__rank" />
                <div className="home-skel__trend-body">
                  <Bone className="home-skel__line home-skel__line--cat" />
                  <Bone className="home-skel__line home-skel__line--title" />
                  <Bone className="home-skel__line home-skel__line--meta" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-skel__section">
          <SectionHeader title={t('news.moreNews')} />
          <div className="home-skel__more">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="home-skel__more-row">
                <Bone className="home-skel__more-thumb" />
                <div className="home-skel__more-body">
                  <Bone className="home-skel__line home-skel__line--cat" />
                  <Bone className="home-skel__line home-skel__line--title" />
                  <Bone className="home-skel__line home-skel__line--title-short" />
                  <Bone className="home-skel__line home-skel__line--meta" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
