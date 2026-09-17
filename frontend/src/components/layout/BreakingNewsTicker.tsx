import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicBreakingNews } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { BreakingNewsItem } from '@/types/content'
import './BreakingNewsTicker.scss'

function itemHref(linkUrl: string | null): string | null {
  if (!linkUrl?.trim()) return null
  return linkUrl.trim()
}

function TickerText({ item }: { item: BreakingNewsItem }) {
  const href = itemHref(item.link_url)
  if (!href) return <span className="breaking-ticker__text">{item.title}</span>

  const label = (
    <>
      {item.title}
      <i className="fa-solid fa-arrow-up-right-from-square breaking-ticker__link-icon" aria-hidden />
    </>
  )

  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a className="breaking-ticker__link" href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    )
  }
  return (
    <Link className="breaking-ticker__link" to={href}>
      {label}
    </Link>
  )
}

export function BreakingNewsTicker() {
  const { t, contentLanguage } = useLanguage()
  const [items, setItems] = useState<BreakingNewsItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchPublicBreakingNews(contentLanguage)
        if (!active) return
        setItems(data)
      } catch {
        if (!active) return
        setItems([])
      } finally {
        if (active) setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [contentLanguage])

  if (!ready || items.length === 0) return null

  const loop = [...items, ...items]

  return (
    <div className="breaking-ticker" role="region" aria-label={t('news.breakingNews')}>
      <div className="breaking-ticker__label">
        <i className="fa-solid fa-bolt" aria-hidden />
        <span>{t('news.breakingNews')}</span>
      </div>
      <div className="breaking-ticker__track">
        <div className="breaking-ticker__marquee">
          {loop.map((item, index) => (
            <span key={`${item.id}-${index}`} className="breaking-ticker__item">
              <TickerText item={item} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
