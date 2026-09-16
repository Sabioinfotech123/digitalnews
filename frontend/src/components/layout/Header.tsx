import { App, Dropdown, Drawer, Input } from 'antd'
import type { InputRef, MenuProps } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import logoImg from '@/assets/logo/logo.png'
import { BRAND } from '@/config/brand'
import { cn } from '@/utils/cn'
import { confirmAction } from '@/utils/confirmAction'
import './Header.scss'

const navItems = [
  { to: '/', key: 'navigation.home' as const },
  { to: '/videos', key: 'navigation.videos' as const },
  { to: '/shorts', key: 'navigation.shorts' as const },
  { to: '/news', key: 'navigation.news' as const },
  { to: '/blogs', key: 'navigation.blogs' as const },
]

export function Header() {
  const { t, uiLanguage, setUiLanguage } = useLanguage()
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<InputRef>(null)

  const toggleLanguage = () => setUiLanguage(uiLanguage === 'en' ? 'te' : 'en')

  const openDashboard = () => {
    window.open('/admin', '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const handleLogout = () => {
    confirmAction({
      modal,
      title: t('auth.logoutConfirmTitle'),
      content: t('auth.logoutConfirmContent'),
      okText: t('auth.logoutConfirmOk'),
      okType: 'danger',
      onConfirm: () => {
        logout()
        setOpen(false)
      },
    })
  }

  const goSearch = (value?: string) => {
    const q = (value ?? searchValue).trim()
    setSearchOpen(false)
    setOpen(false)
    if (!q) {
      navigate('/search')
      return
    }
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  useEffect(() => {
    if (!searchOpen) return
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [searchOpen])

  const accountMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'login',
        icon: <i className="fa-solid fa-right-to-bracket" aria-hidden />,
        label: t('navigation.login'),
        onClick: () => navigate('/login'),
      },
      {
        key: 'register',
        icon: <i className="fa-solid fa-user-plus" aria-hidden />,
        label: t('navigation.register'),
        onClick: () => navigate('/register'),
      },
    ],
    [navigate, t],
  )

  const signedInMenuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = []
    if (isAdmin) {
      items.push({
        key: 'admin',
        icon: <i className="fa-solid fa-gauge-high" aria-hidden />,
        label: t('admin.dashboard'),
        onClick: openDashboard,
      })
    }
    items.push({
      key: 'logout',
      icon: <i className="fa-solid fa-right-from-bracket" aria-hidden />,
      label: t('auth.logout'),
      onClick: handleLogout,
    })
    return items
  }, [isAdmin, t, modal, logout])

  return (
    <header className="site-header">
      <div className="site-header__top mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-3">
        <Link to="/" className="site-header__brand" aria-label={BRAND.name}>
          <img src={logoImg} alt={BRAND.name} className="site-header__logo" />
        </Link>

        <nav className="site-header__nav hide-on-mobile ml-6 flex flex-1 items-center gap-1" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('site-header__link', isActive && 'site-header__link--active')
              }
              end={item.to === '/'}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions ml-auto flex items-center gap-2">
          <div className={cn('site-header__search hide-on-mobile', searchOpen && 'is-open')}>
            {searchOpen ? (
              <Input
                ref={searchInputRef}
                allowClear
                value={searchValue}
                placeholder={t('common.searchPlaceholder')}
                prefix={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
                onChange={(e) => setSearchValue(e.target.value)}
                onPressEnter={() => goSearch()}
                onBlur={() => {
                  if (!searchValue.trim()) setSearchOpen(false)
                }}
                className="site-header__search-input"
                aria-label={t('navigation.search')}
              />
            ) : (
              <AppButton
                type="text"
                className="site-header__icon-btn"
                aria-label={t('navigation.search')}
                icon={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
                onClick={() => setSearchOpen(true)}
              />
            )}
          </div>
          <Link to="/live" className="hide-on-mobile">
            <AppButton
              type="primary"
              className="site-header__live-btn"
              icon={<i className="fa-solid fa-tower-broadcast" aria-hidden />}
            >
              {t('videos.watchLive')}
            </AppButton>
          </Link>
          <AppButton
            type="default"
            className="site-header__lang"
            onClick={toggleLanguage}
            icon={<i className="fa-solid fa-globe" aria-hidden />}
          >
            {uiLanguage === 'en' ? 'తెలుగు' : 'English'}
          </AppButton>
          <Dropdown
            menu={{ items: isAuthenticated ? signedInMenuItems : accountMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <button type="button" className="site-header__account hide-on-mobile">
              <i className="fa-solid fa-user" aria-hidden />
              <span>{t('auth.account')}</span>
              <i className="fa-solid fa-chevron-down site-header__account-caret" aria-hidden />
            </button>
          </Dropdown>
          <AppButton
            type="text"
            className="site-header__icon-btn show-on-mobile-only"
            aria-label="Menu"
            icon={<i className="fa-solid fa-bars" aria-hidden />}
            onClick={() => setOpen(true)}
          />
        </div>
      </div>

      <Drawer
        title={BRAND.name}
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        className="site-header__drawer"
      >
        <nav className="site-header__mobile-nav flex flex-col gap-1">
          <form
            className="site-header__mobile-search"
            onSubmit={(e) => {
              e.preventDefault()
              goSearch()
            }}
          >
            <Input
              allowClear
              value={searchValue}
              placeholder={t('common.searchPlaceholder')}
              prefix={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </form>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="site-header__mobile-link"
              onClick={() => setOpen(false)}
              end={item.to === '/'}
            >
              {t(item.key)}
            </NavLink>
          ))}
          <Link to="/live" className="site-header__mobile-link" onClick={() => setOpen(false)}>
            {t('videos.watchLive')}
          </Link>
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <button type="button" className="site-header__mobile-link" onClick={openDashboard}>
                  {t('admin.dashboard')}
                </button>
              ) : null}
              <button type="button" className="site-header__mobile-link" onClick={handleLogout}>
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="site-header__mobile-link" onClick={() => setOpen(false)}>
                {t('navigation.login')}
              </Link>
              <Link to="/register" className="site-header__mobile-link" onClick={() => setOpen(false)}>
                {t('navigation.register')}
              </Link>
            </>
          )}
        </nav>
      </Drawer>
    </header>
  )
}
