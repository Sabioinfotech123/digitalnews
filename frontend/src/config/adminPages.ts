import { BRAND } from '@/config/brand'
import type { NewsType } from '@/types/content'
import type { TranslationKey } from '@/utils/i18n'

export type AdminCrumb = {
  title: string
  path?: string
}

export type AdminPageMeta = {
  /** Browser tab title */
  documentTitle: string
  breadcrumbs: AdminCrumb[]
  /** Sidebar menu key to highlight */
  menuKey: string
}

export const NEWS_TYPES_LIST = ['featured', 'latest', 'trending', 'more'] as const

export function isNewsTypeParam(value: string | undefined): value is NewsType {
  return value === 'featured' || value === 'latest' || value === 'trending' || value === 'more'
}

/** Short breadcrumb label + document-title label per news type */
export const NEWS_TYPE_PAGE: Record<
  NewsType,
  { crumb: string; titleLabel: string; listPath: string; labelKey: TranslationKey }
> = {
  featured: {
    crumb: 'Feature',
    titleLabel: 'Feature news',
    listPath: '/admin/news/featured',
    labelKey: 'admin.featuredNews',
  },
  latest: {
    crumb: 'Latest',
    titleLabel: 'Latest news',
    listPath: '/admin/news/latest',
    labelKey: 'admin.latestNews',
  },
  trending: {
    crumb: 'Trending',
    titleLabel: 'Trending news',
    listPath: '/admin/news/trending',
    labelKey: 'admin.trendingNews',
  },
  more: {
    crumb: 'More',
    titleLabel: 'More news',
    listPath: '/admin/news/more',
    labelKey: 'admin.moreNews',
  },
}

function brandTitle(suffix: string): string {
  return `${BRAND.name} | ${suffix}`
}

/**
 * URL-based admin page meta (breadcrumbs + browser title).
 * Prefer typed edit URLs: /admin/news/:newsType/edit/:id
 */
export function resolveAdminPageMeta(
  pathname: string,
  t: (key: TranslationKey) => string,
): AdminPageMeta {
  if (pathname === '/admin' || pathname === '/admin/') {
    return {
      documentTitle: brandTitle(t('admin.dashboard')),
      breadcrumbs: [{ title: t('admin.dashboard') }],
      menuKey: '/admin',
    }
  }

  const typedEdit = pathname.match(/^\/admin\/news\/(featured|latest|trending|more)\/edit\/[^/]+$/)
  if (typedEdit) {
    const type = typedEdit[1] as NewsType
    const meta = NEWS_TYPE_PAGE[type]
    return {
      documentTitle: brandTitle(`Edit - ${meta.titleLabel}`),
      breadcrumbs: [
        { title: t('admin.news'), path: '/admin/news' },
        { title: meta.crumb, path: meta.listPath },
        { title: t('admin.editNews') },
      ],
      menuKey: meta.listPath,
    }
  }

  const legacyEdit = pathname.match(/^\/admin\/news\/edit\/[^/]+$/)
  if (legacyEdit) {
    return {
      documentTitle: brandTitle(`Edit - News`),
      breadcrumbs: [
        { title: t('admin.news'), path: '/admin/news' },
        { title: t('admin.editNews') },
      ],
      menuKey: '/admin/news',
    }
  }

  const createMatch = pathname.match(/^\/admin\/news\/create(?:\/(featured|latest|trending|more))?$/)
  if (createMatch) {
    const type = createMatch[1] as NewsType | undefined
    if (type) {
      const meta = NEWS_TYPE_PAGE[type]
      return {
        documentTitle: brandTitle(`Create - ${meta.titleLabel}`),
        breadcrumbs: [
          { title: t('admin.news'), path: '/admin/news' },
          { title: meta.crumb, path: meta.listPath },
          { title: t('admin.createNews') },
        ],
        menuKey: meta.listPath,
      }
    }
    return {
      documentTitle: brandTitle(`Create - News`),
      breadcrumbs: [
        { title: t('admin.news'), path: '/admin/news' },
        { title: t('admin.allNews'), path: '/admin/news' },
        { title: t('admin.createNews') },
      ],
      menuKey: '/admin/news',
    }
  }

  for (const type of NEWS_TYPES_LIST) {
    const meta = NEWS_TYPE_PAGE[type]
    if (pathname === meta.listPath || pathname.startsWith(`${meta.listPath}/`)) {
      return {
        documentTitle: brandTitle(meta.titleLabel),
        breadcrumbs: [
          { title: t('admin.news'), path: '/admin/news' },
          { title: meta.crumb },
        ],
        menuKey: meta.listPath,
      }
    }
  }

  if (pathname.startsWith('/admin/news')) {
    return {
      documentTitle: brandTitle(t('admin.allNews')),
      breadcrumbs: [
        { title: t('admin.news'), path: '/admin/news' },
        { title: t('admin.allNews') },
      ],
      menuKey: '/admin/news',
    }
  }

  const localNewsDetail = pathname.match(/^\/admin\/local-news\/[^/]+$/)
  if (localNewsDetail) {
    return {
      documentTitle: brandTitle(`${t('admin.localNews')} · View`),
      breadcrumbs: [
        { title: t('admin.localFeed'), path: '/admin/local-news' },
        { title: t('admin.localNews'), path: '/admin/local-news' },
        { title: 'View' },
      ],
      menuKey: '/admin/local-news',
    }
  }

  if (pathname.startsWith('/admin/local-news')) {
    return {
      documentTitle: brandTitle(t('admin.localNews')),
      breadcrumbs: [
        { title: t('admin.localFeed'), path: '/admin/local-news' },
        { title: t('admin.localNews') },
      ],
      menuKey: '/admin/local-news',
    }
  }

  const verifiedNewsDetail = pathname.match(/^\/admin\/verified-news\/[^/]+$/)
  if (verifiedNewsDetail) {
    return {
      documentTitle: brandTitle(`${t('admin.verifiedNews')} · View`),
      breadcrumbs: [
        { title: t('admin.localFeed'), path: '/admin/local-news' },
        { title: t('admin.verifiedNews'), path: '/admin/verified-news' },
        { title: 'View' },
      ],
      menuKey: '/admin/verified-news',
    }
  }

  if (pathname.startsWith('/admin/verified-news')) {
    return {
      documentTitle: brandTitle(t('admin.verifiedNews')),
      breadcrumbs: [
        { title: t('admin.localFeed'), path: '/admin/local-news' },
        { title: t('admin.verifiedNews') },
      ],
      menuKey: '/admin/verified-news',
    }
  }

  const createBlog = pathname.match(/^\/admin\/blogs\/create$/)
  if (createBlog) {
    return {
      documentTitle: brandTitle(`Create - Blog`),
      breadcrumbs: [
        { title: t('admin.blogs'), path: '/admin/blogs' },
        { title: t('admin.createNews') },
      ],
      menuKey: '/admin/blogs',
    }
  }

  const editBlog = pathname.match(/^\/admin\/blogs\/edit\/[^/]+$/)
  if (editBlog) {
    return {
      documentTitle: brandTitle(`Edit - Blog`),
      breadcrumbs: [
        { title: t('admin.blogs'), path: '/admin/blogs' },
        { title: t('admin.editNews') },
      ],
      menuKey: '/admin/blogs',
    }
  }

  const createVideo = pathname.match(/^\/admin\/videos\/create$/)
  if (createVideo) {
    return {
      documentTitle: brandTitle(`Create - Video`),
      breadcrumbs: [
        { title: t('admin.videos'), path: '/admin/videos' },
        { title: t('admin.createNews') },
      ],
      menuKey: '/admin/videos',
    }
  }

  const editVideo = pathname.match(/^\/admin\/videos\/edit\/[^/]+$/)
  if (editVideo) {
    return {
      documentTitle: brandTitle(`Edit - Video`),
      breadcrumbs: [
        { title: t('admin.videos'), path: '/admin/videos' },
        { title: t('admin.editNews') },
      ],
      menuKey: '/admin/videos',
    }
  }

  const simple: Array<{ prefix: string; titleKey: TranslationKey; crumbs: AdminCrumb[]; menuKey: string }> = [
    {
      prefix: '/admin/blogs',
      titleKey: 'admin.blogs',
      crumbs: [{ title: t('admin.blogs') }],
      menuKey: '/admin/blogs',
    },
    {
      prefix: '/admin/videos',
      titleKey: 'admin.videos',
      crumbs: [{ title: t('admin.videos') }],
      menuKey: '/admin/videos',
    },
    {
      prefix: '/admin/breaking-news',
      titleKey: 'admin.breakingNews',
      crumbs: [{ title: t('admin.breakingNews') }],
      menuKey: '/admin/breaking-news',
    },
    {
      prefix: '/admin/categories',
      titleKey: 'admin.categories',
      crumbs: [{ title: t('admin.taxonomy') }, { title: t('admin.categories') }],
      menuKey: '/admin/categories',
    },
    {
      prefix: '/admin/tags',
      titleKey: 'admin.tags',
      crumbs: [{ title: t('admin.taxonomy') }, { title: t('admin.tags') }],
      menuKey: '/admin/tags',
    },
    {
      prefix: '/admin/media',
      titleKey: 'admin.media',
      crumbs: [{ title: t('admin.media') }],
      menuKey: '/admin/media',
    },
    {
      prefix: '/admin/users',
      titleKey: 'admin.users',
      crumbs: [{ title: t('admin.users') }],
      menuKey: '/admin/users',
    },
    {
      prefix: '/admin/settings',
      titleKey: 'admin.settings',
      crumbs: [{ title: t('admin.settings') }],
      menuKey: '/admin/settings',
    },
    {
      prefix: '/admin/profile',
      titleKey: 'admin.profile',
      crumbs: [{ title: t('admin.profile') }],
      menuKey: '/admin/profile',
    },
  ]

  for (const entry of simple) {
    if (pathname.startsWith(entry.prefix)) {
      return {
        documentTitle: brandTitle(t(entry.titleKey)),
        breadcrumbs: entry.crumbs,
        menuKey: entry.menuKey,
      }
    }
  }

  return {
    documentTitle: brandTitle(t('admin.dashboard')),
    breadcrumbs: [{ title: t('admin.dashboard'), path: '/admin' }],
    menuKey: '/admin',
  }
}

export function adminNewsEditPath(newsType: NewsType, id: string): string {
  return `/admin/news/${newsType}/edit/${id}`
}
