import { Drawer } from 'antd'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { BRAND } from '@/config/brand'
import { cn } from '@/utils/cn'
import './Header.scss'

const navItems = [
  { to: '/', key: 'navigation.home' as const },
  { to: '/live', key: 'navigation.live' as const },
  { to: '/videos', key: 'navigation.videos' as const },
  { to: '/shorts', key: 'navigation.shorts' as const },
  { to: '/news', key: 'navigation.news' as const },
  { to: '/blogs', key: 'navigation.blogs' as const },
]

export function Header() {
  const { t, uiLanguage, setUiLanguage } = useLanguage()
  const [open, setOpen] = useState(false)

  const toggleLanguage = () => setUiLanguage(uiLanguage === 'en' ? 'te' : 'en')

  return (
    <header className="site-header">
      <div className="site-header__top mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-3">
        <Link to="/" className="site-header__brand" aria-label={BRAND.name}>
          <img src={BRAND.logo} alt={BRAND.name} className="site-header__logo h-8 w-auto" width={132} height={36} />
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
            type="text"
            className="site-header__icon-btn hide-on-mobile"
            aria-label={t('navigation.search')}
            icon={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
          />
          <AppButton
            type="default"
            className="site-header__lang"
            onClick={toggleLanguage}
            icon={<i className="fa-solid fa-globe" aria-hidden />}
          >
            {uiLanguage === 'en' ? 'తెలుగు' : 'English'}
          </AppButton>
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
          <Link to="/login" className="site-header__mobile-link" onClick={() => setOpen(false)}>
            {t('navigation.login')}
          </Link>
        </nav>
      </Drawer>
    </header>
  )
}
