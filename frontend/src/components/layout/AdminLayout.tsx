import { Breadcrumb, Layout, Menu, type MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { BRAND } from '@/config/brand'
import type { TranslationKey } from '@/utils/i18n'
import './AdminLayout.scss'

const { Header, Sider, Content } = Layout

type Crumb = { title: string; path?: string }

function newsTypeLabel(type: string, t: (key: TranslationKey) => string): string {
  if (type === 'featured') return t('admin.featuredNews')
  if (type === 'latest') return t('admin.latestNews')
  if (type === 'trending') return t('admin.trendingNews')
  if (type === 'more') return t('admin.moreNews')
  return t('admin.allNews')
}

function buildAdminBreadcrumbs(pathname: string, t: (key: TranslationKey) => string): Crumb[] {
  if (pathname === '/admin' || pathname === '/admin/') {
    return [{ title: t('admin.dashboard') }]
  }

  if (pathname.startsWith('/admin/news')) {
    const crumbs: Crumb[] = [
      { title: t('admin.content') },
      { title: t('admin.news'), path: '/admin/news' },
    ]

    const createMatch = pathname.match(/^\/admin\/news\/create(?:\/([^/]+))?$/)
    if (createMatch) {
      const type = createMatch[1]
      if (type) {
        crumbs.push({
          title: newsTypeLabel(type, t),
          path: `/admin/news/${type}`,
        })
      } else {
        crumbs.push({ title: t('admin.allNews'), path: '/admin/news' })
      }
      crumbs.push({ title: t('admin.createNews') })
      return crumbs
    }

    if (pathname.startsWith('/admin/news/edit/')) {
      crumbs.push({ title: t('admin.editNews') })
      return crumbs
    }

    if (pathname.startsWith('/admin/news/featured')) {
      crumbs.push({ title: t('admin.featuredNews') })
      return crumbs
    }
    if (pathname.startsWith('/admin/news/latest')) {
      crumbs.push({ title: t('admin.latestNews') })
      return crumbs
    }
    if (pathname.startsWith('/admin/news/trending')) {
      crumbs.push({ title: t('admin.trendingNews') })
      return crumbs
    }
    if (pathname.startsWith('/admin/news/more')) {
      crumbs.push({ title: t('admin.moreNews') })
      return crumbs
    }

    crumbs.push({ title: t('admin.allNews') })
    return crumbs
  }

  if (pathname.startsWith('/admin/blogs')) {
    return [{ title: t('admin.content') }, { title: t('admin.blogs') }]
  }
  if (pathname.startsWith('/admin/videos')) {
    return [{ title: t('admin.content') }, { title: t('admin.videos') }]
  }
  if (pathname.startsWith('/admin/categories')) {
    return [{ title: t('admin.taxonomy') }, { title: t('admin.categories') }]
  }
  if (pathname.startsWith('/admin/tags')) {
    return [{ title: t('admin.taxonomy') }, { title: t('admin.tags') }]
  }
  if (pathname.startsWith('/admin/media')) return [{ title: t('admin.media') }]
  if (pathname.startsWith('/admin/users')) return [{ title: t('admin.users') }]
  if (pathname.startsWith('/admin/settings')) return [{ title: t('admin.settings') }]
  if (pathname.startsWith('/admin/profile')) return [{ title: t('admin.profile') }]

  return [{ title: t('admin.dashboard'), path: '/admin' }]
}

export function AdminLayout() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const breadcrumbs = useMemo(
    () => buildAdminBreadcrumbs(location.pathname, t),
    [location.pathname, t],
  )

  const selectedKey = useMemo(() => {
    const path = location.pathname
    const createMatch = path.match(/^\/admin\/news\/create\/([^/]+)$/)
    if (createMatch) return `/admin/news/${createMatch[1]}`
    if (path.startsWith('/admin/news/featured')) return '/admin/news/featured'
    if (path.startsWith('/admin/news/latest')) return '/admin/news/latest'
    if (path.startsWith('/admin/news/trending')) return '/admin/news/trending'
    if (path.startsWith('/admin/news/more')) return '/admin/news/more'
    if (path.startsWith('/admin/news')) return '/admin/news'
    if (path.startsWith('/admin/blogs')) return '/admin/blogs'
    if (path.startsWith('/admin/videos')) return '/admin/videos'
    if (path.startsWith('/admin/categories')) return '/admin/categories'
    if (path.startsWith('/admin/tags')) return '/admin/tags'
    if (path.startsWith('/admin/media')) return '/admin/media'
    if (path.startsWith('/admin/users')) return '/admin/users'
    if (path.startsWith('/admin/settings')) return '/admin/settings'
    if (path.startsWith('/admin/profile')) return '/admin/profile'
    return '/admin'
  }, [location.pathname])

  const openKeysForRoute = useMemo(() => {
    if (selectedKey.startsWith('/admin/news') || selectedKey === '/admin/blogs' || selectedKey === '/admin/videos') {
      return selectedKey.startsWith('/admin/news') ? ['content', 'news-types'] : ['content']
    }
    if (['/admin/categories', '/admin/tags'].includes(selectedKey)) {
      return ['taxonomy']
    }
    return []
  }, [selectedKey])

  const [openKeys, setOpenKeys] = useState<string[]>(openKeysForRoute)

  useEffect(() => {
    setOpenKeys(openKeysForRoute)
  }, [openKeysForRoute])

  const items: MenuProps['items'] = [
    {
      key: '/admin',
      icon: <i className="fa-solid fa-gauge-high" aria-hidden />,
      label: <Link to="/admin">{t('admin.dashboard')}</Link>,
    },
    {
      key: 'content',
      icon: <i className="fa-solid fa-newspaper" aria-hidden />,
      label: t('admin.content'),
      children: [
        {
          key: 'news-types',
          label: t('admin.news'),
          children: [
            {
              key: '/admin/news',
              label: <Link to="/admin/news">{t('admin.allNews')}</Link>,
            },
            {
              key: '/admin/news/featured',
              label: <Link to="/admin/news/featured">{t('admin.featuredNews')}</Link>,
            },
            {
              key: '/admin/news/latest',
              label: <Link to="/admin/news/latest">{t('admin.latestNews')}</Link>,
            },
            {
              key: '/admin/news/trending',
              label: <Link to="/admin/news/trending">{t('admin.trendingNews')}</Link>,
            },
            {
              key: '/admin/news/more',
              label: <Link to="/admin/news/more">{t('admin.moreNews')}</Link>,
            },
          ],
        },
        {
          key: '/admin/blogs',
          label: <Link to="/admin/blogs">{t('admin.blogs')}</Link>,
        },
        {
          key: '/admin/videos',
          label: <Link to="/admin/videos">{t('admin.videos')}</Link>,
        },
      ],
    },
    {
      key: 'taxonomy',
      icon: <i className="fa-solid fa-tags" aria-hidden />,
      label: t('admin.taxonomy'),
      children: [
        {
          key: '/admin/categories',
          label: <Link to="/admin/categories">{t('admin.categories')}</Link>,
        },
        {
          key: '/admin/tags',
          label: <Link to="/admin/tags">{t('admin.tags')}</Link>,
        },
      ],
    },
    {
      key: '/admin/media',
      icon: <i className="fa-solid fa-photo-film" aria-hidden />,
      label: <Link to="/admin/media">{t('admin.media')}</Link>,
    },
    {
      key: '/admin/users',
      icon: <i className="fa-solid fa-users" aria-hidden />,
      label: <Link to="/admin/users">{t('admin.users')}</Link>,
    },
    {
      key: '/admin/settings',
      icon: <i className="fa-solid fa-gear" aria-hidden />,
      label: <Link to="/admin/settings">{t('admin.settings')}</Link>,
    },
    {
      key: '/admin/profile',
      icon: <i className="fa-solid fa-user" aria-hidden />,
      label: <Link to="/admin/profile">{t('admin.profile')}</Link>,
    },
  ]

  return (
    <Layout className="admin-layout min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        className="admin-layout__sider"
        width={240}
      >
        <div className="admin-layout__brand">
          <span className="admin-layout__brand-mark">{BRAND.shortName}</span>
          {!collapsed && <span className="admin-layout__brand-text">CMS</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={items}
        />      </Sider>

      <Layout>
        <Header className="admin-layout__header">
          <div className="admin-layout__header-left">
            <Breadcrumb
              className="admin-layout__breadcrumb"
              items={breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return {
                  title:
                    crumb.path && !isLast ? (
                      <Link to={crumb.path}>{crumb.title}</Link>
                    ) : (
                      crumb.title
                    ),
                }
              })}
            />
          </div>
          <div className="admin-layout__header-actions">
            <AppButton type="default" onClick={() => navigate('/')}>
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden /> {t('admin.backToSite')}
            </AppButton>
            <AppButton
              type="primary"
              onClick={() => {
                logout()
                navigate('/admin/login')
              }}
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden /> {t('admin.logout')}
            </AppButton>
          </div>
        </Header>
        <Content className="admin-layout__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
