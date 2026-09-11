import { Breadcrumb, Layout, Menu, type MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import logoImg from '@/assets/logo/logo.png'
import { resolveAdminPageMeta } from '@/config/adminPages'
import './AdminLayout.scss'

const { Header, Sider, Content } = Layout

export function AdminLayout() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

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
        breakpoint="lg"
        className="admin-layout__sider"
        width={240}
      >
        <div className="admin-layout__brand">
          <img src={logoImg} alt="AK News" className="admin-layout__brand-name" />
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
