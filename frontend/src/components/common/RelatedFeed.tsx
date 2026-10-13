import { useState } from 'react'
import { Link } from 'react-router-dom'
import './RelatedFeed.scss'

export type RelatedFeedItem = {
  id: string
  slug: string
  title: string
  image_url: string | null
  category_name?: string | null
  published_at?: string | null
  created_at?: string | null
}

interface RelatedFeedProps {
  title: string
  items: RelatedFeedItem[]
  basePath: '/news' | '/blogs'
  moreLabel?: string
  moreTo?: string
}

function Cover({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="related-feed__thumb related-feed__thumb--empty" aria-hidden>
        <i className="fa-regular fa-image" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className="related-feed__thumb"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function RelatedFeed({ title, items, basePath, moreLabel, moreTo }: RelatedFeedProps) {
  if (!items.length) return null

  return (
    <aside className="related-feed" aria-label={title}>
      <div className="related-feed__head">
        <h2 className="related-feed__title">{title}</h2>
        {moreLabel && moreTo ? (
          <Link to={moreTo} className="related-feed__more">
            {moreLabel}
          </Link>
        ) : null}
      </div>
      <ul className="related-feed__list">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`${basePath}/${item.slug}`} className="related-feed__item">
              <Cover src={item.image_url} />
              <div className="related-feed__copy">
                {item.category_name ? (
                  <span className="related-feed__cat">{item.category_name}</span>
                ) : null}
                <span className="related-feed__item-title">{item.title}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
