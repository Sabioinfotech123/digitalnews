import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { fetchCategories } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { Category } from '@/types/content'
import { cn } from '@/utils/cn'
import './CategoryNav.scss'

/** Desktop shows this many categories inline; the rest go under "More". */
const MAX_INLINE_CATEGORIES = 7

export function CategoryNav() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const [categories, setCategories] = useState<Category[]>([])
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [moreOpen])

  if (!categories.length) return null

  const hasOverflow = categories.length > MAX_INLINE_CATEGORIES
  const overflow = hasOverflow ? categories.slice(MAX_INLINE_CATEGORIES) : []
  const overflowActive = overflow.some((cat) => pathname === `/category/${cat.slug}`)

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
          {categories.map((cat, index) => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={({ isActive }) =>
                cn(
                  'category-nav__link',
                  isActive && 'category-nav__link--active',
                  index >= MAX_INLINE_CATEGORIES && 'category-nav__link--overflow',
                )
              }
            >
              {cat.name}
            </NavLink>
          ))}

          {hasOverflow ? (
            <div
              ref={moreRef}
              className={cn('category-nav__more', moreOpen && 'category-nav__more--open')}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setMoreOpen(true)
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') setMoreOpen(false)
              }}
            >
              <button
                type="button"
                className={cn(
                  'category-nav__link category-nav__more-btn',
                  overflowActive && 'category-nav__link--active',
                )}
                aria-haspopup="true"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                {t('category.more')}
                <i className="fa-solid fa-chevron-down category-nav__more-icon" aria-hidden />
              </button>
              <div
                className={cn(
                  'category-nav__menu',
                  overflow.length === 1 && 'category-nav__menu--single',
                )}
                role="menu"
              >
                {overflow.map((cat) => (
                  <NavLink
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    role="menuitem"
                    className={({ isActive }) =>
                      cn('category-nav__menu-link', isActive && 'category-nav__menu-link--active')
                    }
                  >
                    {cat.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
