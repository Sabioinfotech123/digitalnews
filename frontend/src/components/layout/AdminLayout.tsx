import { App, Breadcrumb, Dropdown, Layout, Menu, type MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import { AppButton } from '@/components/common/AppButton'
import { resolveAdminPageMeta } from '@/config/adminPages'
import { cn } from '@/utils/cn'
import { confirmAction } from '@/utils/confirmAction'
import './AdminLayout.scss'

const { Header, Sider, Content } = Layout

export function AdminLayout() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const { logoUrl } = useSiteSettings()
  const { modal } = App.useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    confirmAction({
      modal,
      title: t('auth.logoutConfirmTitle'),
      content: t('auth.logoutConfirmContent'),
      okText: t('auth.logoutConfirmOk'),
      okType: 'danger',
      onConfirm: () => {
        logout()
        navigate('/admin/login')
      },
    })
  }

  const quickAddItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'breaking',
        icon: <i className="fa-solid fa-bolt" aria-hidden />,
        label: t('admin.addBreakingNews'),
        onClick: () => navigate('/admin/breaking-news?create=1'),
      },
      {
        key: 'category',
        icon: <i className="fa-solid fa-folder" aria-hidden />,
        label: t('admin.addCategory'),
        onClick: () => navigate('/admin/categories?create=1'),
      },
      {
        key: 'tag',
        icon: <i className="fa-solid fa-tags" aria-hidden />,
        label: t('admin.addTag'),
        onClick: () => navigate('/admin/tags?create=1'),
      },
      { type: 'divider' },
      {
        key: 'featured',
        icon: <i className="fa-solid fa-star" aria-hidden />,
        label: t('admin.addFeaturedNews'),
        onClick: () => navigate('/admin/news/create/featured'),
      },
      {
        key: 'latest',
        icon: <i className="fa-solid fa-clock" aria-hidden />,
        label: t('admin.addLatestNews'),
        onClick: () => navigate('/admin/news/create/latest'),
      },
      {
        key: 'trending',
        icon: <i className="fa-solid fa-fire" aria-hidden />,
        label: t('admin.addTrendingNews'),
        onClick: () => navigate('/admin/news/create/trending'),
      },
      {
        key: 'more',
        icon: <i className="fa-solid fa-ellipsis" aria-hidden />,
        label: t('admin.addMoreNews'),
        onClick: () => navigate('/admin/news/create/more'),
      },
      { type: 'divider' },
      {
        key: 'blog',
        icon: <i className="fa-solid fa-pen-nib" aria-hidden />,
        label: t('admin.addBlog'),
        onClick: () => navigate('/admin/blogs/create'),
      },
      {
        key: 'user',
        icon: <i className="fa-solid fa-user-plus" aria-hidden />,
        label: t('admin.addUser'),
        onClick: () => navigate('/admin/users?create=1'),
      },
    ],
    [navigate, t],
  )

  const pageMeta = useMemo(
    () => resolveAdminPageMeta(location.pathname, t),
    [location.pathname, t],
  )

  useEffect(() => {
    document.title = pageMeta.documentTitle
  }, [pageMeta.documentTitle])

  const selectedKey = pageMeta.menuKey

  const openKeysForRoute = useMemo(() => {
    if (selectedKey.startsWith('/admin/news')) return ['news']
    if (selectedKey.startsWith('/admin/local-news') || selectedKey.startsWith('/admin/verified-news')) {
      return ['local-feed']
    }
    if (['/admin/categories', '/admin/tags'].includes(selectedKey)) return ['taxonomy']
    return []
  }, [selectedKey])

  const [openKeys, setOpenKeys] = useState<string[]>(openKeysForRoute)

  useEffect(() => {
    setOpenKeys(openKeysForRoute)
  }, [openKeysForRoute])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  const items: MenuProps['items'] = [
    {
      key: '/admin',
      icon: <i className="fa-solid fa-gauge-high" aria-hidden />,
      label: <Link to="/admin">{t('admin.dashboard')}</Link>,
    },
    {
      key: '/admin/breaking-news',
      icon: <i className="fa-solid fa-bolt" aria-hidden />,
      label: <Link to="/admin/breaking-news">{t('admin.breakingNews')}</Link>,
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
      key: 'news',
      icon: <i className="fa-solid fa-newspaper" aria-hidden />,
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
      key: 'local-feed',
      icon: <i className="fa-solid fa-shield-halved" aria-hidden />,
      label: t('admin.localFeed'),
      children: [
        {
          key: '/admin/local-news',
          label: <Link to="/admin/local-news">{t('admin.localNews')}</Link>,
        },
        {
          key: '/admin/verified-news',
          label: <Link to="/admin/verified-news">{t('admin.verifiedNews')}</Link>,
        },
      ],
    },
    {
      key: '/admin/blogs',
      icon: <i className="fa-solid fa-blog" aria-hidden />,
      label: <Link to="/admin/blogs">{t('admin.blogs')}</Link>,
    },
    {
      key: '/admin/videos',
      icon: <i className="fa-solid fa-video" aria-hidden />,
      label: <Link to="/admin/videos">{t('admin.videos')}</Link>,
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
    <Layout className="admin-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        className="admin-layout__sider"
        width={240}
      >
        <div className="admin-layout__brand">
          {!collapsed ? (
            <img src={logoUrl} alt="AK News" className="admin-layout__brand-name" />
          ) : null}
          <button
            type="button"
            className="admin-layout__sider-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            <i
              className={cn(
                'fa-solid',
                collapsed ? 'fa-angles-right' : 'fa-angles-left',
              )}
              aria-hidden
            />
          </button>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={items}
          className="admin-layout__menu"
          inlineIndent={18}
        />
      </Sider>

      <Layout className="admin-layout__main">
        <Header className="admin-layout__header">
          <div className="admin-layout__header-left">
            <Breadcrumb
              className="admin-layout__breadcrumb"
              items={pageMeta.breadcrumbs.map((crumb, index) => {
                const isLast = index === pageMeta.breadcrumbs.length - 1
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
            <Dropdown menu={{ items: quickAddItems }} placement="bottomRight" trigger={['click']}>
              <AppButton type="default" className="admin-layout__add-btn">
                <i className="fa-solid fa-plus" aria-hidden /> {t('admin.quickAdd')}
              </AppButton>
            </Dropdown>
            <AppButton type="default" onClick={() => navigate('/')}>
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden /> {t('admin.backToSite')}
            </AppButton>
            <AppButton type="primary" onClick={handleLogout}>
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
