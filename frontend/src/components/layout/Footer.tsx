import { Link } from 'react-router-dom'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { BRAND } from '@/config/brand'
import './Footer.scss'

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-auto border-t-[3px] border-primary bg-ink text-white/85">
      <div className="mx-auto grid max-w-[1200px] gap-5 px-5 pt-8 pb-6">
        <div>
          <span className="site-footer__name inline-block border-b-[3px] border-primary pb-0.5 font-heading text-xl font-bold text-paper">
            {BRAND.name}
          </span>
          <p className="mt-2 mb-0 text-sm text-white/65">{BRAND.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          <Link to="/live" className="font-ui text-sm text-white/80 hover:text-primary">
            {t('navigation.live')}
          </Link>
          <Link to="/videos" className="font-ui text-sm text-white/80 hover:text-primary">
            {t('navigation.videos')}
          </Link>
          <Link to="/shorts" className="font-ui text-sm text-white/80 hover:text-primary">
            {t('navigation.shorts')}
          </Link>
          <Link to="/news" className="font-ui text-sm text-white/80 hover:text-primary">
            {t('navigation.news')}
          </Link>
          <a
            href={BRAND.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-ui text-sm text-white/80 hover:text-primary"
          >
            <i className="fa-brands fa-youtube" aria-hidden /> {t('videos.youtube')}
          </a>
        </nav>
        <p className="m-0 border-t border-white/12 pt-3 font-ui text-xs text-white/50">
          © {year} {BRAND.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
