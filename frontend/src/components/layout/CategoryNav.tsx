import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { fetchCategories } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { Category } from '@/types/content'
import { cn } from '@/utils/cn'
import './CategoryNav.scss'

export function CategoryNav() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const [categories, setCategories] = useState<Category[]>([])
  const newsListActive = pathname === '/news'

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const rows = await fetchCategories()
        if (!active) return
        setCategories(rows.filter((row) => row.is_active))
      } catch {
        if (!active) return
        setCategories([])
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (!categories.length) return null

  return (
    <nav className="category-nav" aria-label={t('category.navLabel')}>
      <div className="category-nav__inner">
        <div className="category-nav__scroll">
          <NavLink
            to="/news"
            className={cn(
              'category-nav__link',
              newsListActive && 'category-nav__link--active',
            )}
          >
            {t('navigation.news')}
          </NavLink>
          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={({ isActive }) =>
                cn('category-nav__link', isActive && 'category-nav__link--active')
              }
            >
              {cat.name}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
