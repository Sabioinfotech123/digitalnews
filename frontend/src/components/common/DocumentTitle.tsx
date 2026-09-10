import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BRAND } from '@/config/brand'

function resolveTitle(pathname: string): string {
  const brand = BRAND.name

  const exact: Record<string, string> = {
    '/': brand,
    '/live': `Live TV | ${brand}`,
    '/videos': `Videos | ${brand}`,
    '/shorts': `Shorts | ${brand}`,
    '/today-news': `Today News | ${brand}`,
    '/news': `News | ${brand}`,
    '/blogs': `Blogs | ${brand}`,
    '/login': `Login | ${brand}`,
    '/search': `Search | ${brand}`,
    '/bookmarks': `Bookmarks | ${brand}`,
    '/profile': `Profile | ${brand}`,
    '/admin/login': `Admin Login | ${brand}`,
    '/admin': `Dashboard | ${brand} CMS`,
    '/admin/news': `News | ${brand} CMS`,
    '/admin/news/create': `Create News | ${brand} CMS`,
    '/admin/blogs': `Blogs | ${brand} CMS`,
    '/admin/videos': `Videos | ${brand} CMS`,
    '/admin/categories': `Categories | ${brand} CMS`,
    '/admin/tags': `Tags | ${brand} CMS`,
    '/admin/media': `Media | ${brand} CMS`,
    '/admin/users': `Users | ${brand} CMS`,
    '/admin/settings': `Settings | ${brand} CMS`,
    '/admin/profile': `Profile | ${brand} CMS`,
  }

  if (exact[pathname]) return exact[pathname]

  if (pathname.startsWith('/admin/news/edit/')) return `Edit News | ${brand} CMS`
  if (pathname.startsWith('/news/')) return `News | ${brand}`
  if (pathname.startsWith('/blogs/')) return `Blog | ${brand}`
  if (pathname.startsWith('/videos/')) return `Video | ${brand}`
  if (pathname.startsWith('/category/')) return `Category | ${brand}`
  if (pathname.startsWith('/admin/')) return `Admin | ${brand} CMS`

  return brand
}

/** Updates the browser tab title from the current route + brand config. */
export function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = resolveTitle(pathname)
  }, [pathname])

  return null
}

/** Set a custom tab title for detail pages (overrides route map while mounted). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`
    return () => {
      document.title = previous
    }
  }, [title])
}
