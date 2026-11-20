import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MediaCover } from '@/components/common/MediaCover'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { HomeCategoryBlock } from '@/utils/homeSections'
import { cn } from '@/utils/cn'
import './HomeCategoryRailSection.scss'

function readCollapsed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

interface HomeCategoryRailSectionProps {
  block: HomeCategoryBlock
}

function SideHeadline({ slug, category, title, date }: { slug: string; category: string; title: string; date: string }) {
  return (
    <article className="home-cat-rail__side-item">
      <Link to={`/news/${slug}`} className="home-cat-rail__side-link">
        <span className="home-cat-rail__side-cat">{category}</span>
        <h4 className="home-cat-rail__side-title">{title}</h4>
        <p className="home-cat-rail__side-meta">{date}</p>
      </Link>
    </article>
  )
}

export function HomeCategoryRailSection({ block }: HomeCategoryRailSectionProps) {
  const { t } = useLanguage()
  const storageKey = `home-cat-rail-collapsed:${block.categorySlug}`
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey))
  const [lead, ...rest] = block.articles
  if (!lead) return null

  const moreTo = `/category/${block.categorySlug}`
  const panelId = `home-cat-rail-panel-${block.categorySlug}`

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(storageKey, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <section
      className={cn('home-cat-rail', collapsed && 'home-cat-rail--collapsed')}
      aria-label={block.categoryName}
    >
      <SectionHeader
        title={block.categoryName}
        moreLabel={t('news.seeMore')}
        moreTo={moreTo}
        className="home-cat-rail__header"
      >
        <button
          type="button"
          className="home-cat-rail__collapse"
          aria-expanded={!collapsed}
          aria-controls={panelId}
          onClick={toggleCollapsed}
        >
          <span className="home-cat-rail__collapse-label">
            {collapsed ? t('category.expandSection') : t('category.collapseSection')}
          </span>
          <i
            className={cn('fa-solid', collapsed ? 'fa-chevron-down' : 'fa-chevron-up')}
            aria-hidden
          />
        </button>
      </SectionHeader>
      {!collapsed ? (
      <div id={panelId} className="home-cat-rail__grid">
        <article className="home-cat-rail__lead">
          <Link to={`/news/${lead.slug}`} className="home-cat-rail__lead-link">
            <MediaCover
              className="home-cat-rail__lead-media"
              src={lead.imageUrl}
              fallbackBackground={lead.accent}
              overlay
            />
            <div className="home-cat-rail__lead-copy">
              <h3 className="home-cat-rail__lead-title">{lead.title}</h3>
              {lead.excerpt ? <p className="home-cat-rail__lead-excerpt">{lead.excerpt}</p> : null}
              <p className="home-cat-rail__lead-meta">{lead.publishedLabel}</p>
            </div>
          </Link>
        </article>
        {rest.length ? (
          <div className="home-cat-rail__side">
            {rest.slice(0, 4).map((article) => (
              <SideHeadline
                key={article.id}
                slug={article.slug}
                category={article.category}
                title={article.title}
                date={article.publishedLabel}
              />
            ))}
          </div>
        ) : null}
      </div>
      ) : null}
    </section>
  )
}
