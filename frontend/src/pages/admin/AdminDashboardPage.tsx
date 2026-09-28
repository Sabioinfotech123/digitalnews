import { Skeleton } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats } from '@/api/auth'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { DashboardStats } from '@/types/auth'
import './AdminDashboardPage.scss'

const emptyStats: DashboardStats = {
  total_news: 0,
  published_news: 0,
  draft_news: 0,
  total_blogs: 0,
  total_videos: 0,
  total_users: 0,
  total_views: 0,
}

type StatTone = 'primary' | 'success' | 'warning' | 'neutral' | 'info' | 'accent' | 'muted'

type StatCard = {
  key: keyof DashboardStats
  title: string
  value: number
  icon: string
  tone: StatTone
  to?: string
}

type QuickLink = {
  key: string
  label: string
  hint: string
  icon: string
  to: string
}

function formatCount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
}

export function AdminDashboardPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchDashboardStats()
        if (active) setStats(data)
      } catch {
        if (active) setStats(emptyStats)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const firstName = useMemo(() => {
    const name = user?.full_name?.trim()
    if (!name) return null
    return name.split(/\s+/)[0]
  }, [user?.full_name])

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [],
  )

  const cards: StatCard[] = [
    {
      key: 'total_news',
      title: t('admin.totalNews'),
      value: stats.total_news,
      icon: 'fa-newspaper',
      tone: 'primary',
      to: '/admin/news',
    },
    {
      key: 'published_news',
      title: t('admin.publishedNews'),
      value: stats.published_news,
      icon: 'fa-circle-check',
      tone: 'success',
      to: '/admin/news',
    },
    {
      key: 'draft_news',
      title: t('admin.draftNews'),
      value: stats.draft_news,
      icon: 'fa-file-pen',
      tone: 'warning',
      to: '/admin/news',
    },
    {
      key: 'total_blogs',
      title: t('admin.totalBlogs'),
      value: stats.total_blogs,
      icon: 'fa-blog',
      tone: 'info',
      to: '/admin/blogs',
    },
    {
      key: 'total_videos',
      title: t('admin.totalVideos'),
      value: stats.total_videos,
      icon: 'fa-video',
      tone: 'accent',
      to: '/admin/videos',
    },
    {
      key: 'total_users',
      title: t('admin.totalUsers'),
      value: stats.total_users,
      icon: 'fa-users',
      tone: 'neutral',
      to: '/admin/users',
    },
    {
      key: 'total_views',
      title: t('admin.totalViews'),
      value: stats.total_views,
      icon: 'fa-eye',
      tone: 'muted',
    },
  ]

  const quickLinks: QuickLink[] = [
    {
      key: 'news',
      label: t('admin.addLatestNews'),
      hint: t('admin.quickLinkNewsHint'),
      icon: 'fa-plus',
      to: '/admin/news/create/latest',
    },
    {
      key: 'video',
      label: t('admin.addVideo'),
      hint: t('admin.quickLinkVideoHint'),
      icon: 'fa-film',
      to: '/admin/videos/create',
    },
    {
      key: 'local',
      label: t('admin.localNews'),
      hint: t('admin.quickLinkLocalHint'),
      icon: 'fa-location-dot',
      to: '/admin/local-news',
    },
    {
      key: 'breaking',
      label: t('admin.addBreakingNews'),
      hint: t('admin.quickLinkBreakingHint'),
      icon: 'fa-bolt',
      to: '/admin/breaking-news',
    },
  ]

  const publishRate =
    stats.total_news > 0 ? Math.round((stats.published_news / stats.total_news) * 100) : 0

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__hero">
        <div className="admin-dashboard__hero-copy">
          <p className="admin-dashboard__eyebrow">{todayLabel}</p>
          <h1 className="admin-dashboard__title">
            {firstName ? `${t('admin.welcome')}, ${firstName}` : t('admin.dashboard')}
          </h1>
          <p className="admin-dashboard__subtitle">{t('admin.dashboardSubtitle')}</p>
        </div>
        <div className="admin-dashboard__hero-aside" aria-live="polite">
          {loading ? (
            <Skeleton active paragraph={false} title={{ width: 120 }} />
          ) : (
            <>
              <span className="admin-dashboard__hero-metric">{publishRate}%</span>
              <span className="admin-dashboard__hero-metric-label">{t('admin.publishRate')}</span>
            </>
          )}
        </div>
      </header>

      <section className="admin-dashboard__section" aria-label={t('admin.overview')}>
        <div className="admin-dashboard__section-head">
          <h2 className="admin-dashboard__section-title">{t('admin.overview')}</h2>
        </div>

        <div className="admin-dashboard__stats">
          {cards.map((card) => {
            const body = (
              <>
                <div className={`admin-dashboard__stat-icon admin-dashboard__stat-icon--${card.tone}`} aria-hidden>
                  <i className={`fa-solid ${card.icon}`} />
                </div>
                <div className="admin-dashboard__stat-body">
                  <span className="admin-dashboard__stat-label">{card.title}</span>
                  {loading ? (
                    <Skeleton active title={{ width: 56 }} paragraph={false} />
                  ) : (
                    <span className="admin-dashboard__stat-value">{formatCount(card.value)}</span>
                  )}
                </div>
                {card.to ? (
                  <i className="fa-solid fa-arrow-right admin-dashboard__stat-arrow" aria-hidden />
                ) : null}
              </>
            )

            if (card.to) {
              return (
                <Link
                  key={card.key}
                  to={card.to}
                  className="admin-dashboard__stat admin-dashboard__stat--link"
                >
                  {body}
                </Link>
              )
            }

            return (
              <div key={card.key} className="admin-dashboard__stat">
                {body}
              </div>
            )
          })}
        </div>
      </section>

      <div className="admin-dashboard__split">
        <section className="admin-dashboard__panel" aria-label={t('admin.quickActions')}>
          <div className="admin-dashboard__section-head">
            <h2 className="admin-dashboard__section-title">{t('admin.quickActions')}</h2>
          </div>
          <div className="admin-dashboard__quick">
            {quickLinks.map((item) => (
              <Link key={item.key} to={item.to} className="admin-dashboard__quick-card">
                <span className="admin-dashboard__quick-icon" aria-hidden>
                  <i className={`fa-solid ${item.icon}`} />
                </span>
                <span className="admin-dashboard__quick-copy">
                  <span className="admin-dashboard__quick-label">{item.label}</span>
                  <span className="admin-dashboard__quick-hint">{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-dashboard__panel" aria-label={t('admin.recentActivity')}>
          <div className="admin-dashboard__section-head">
            <h2 className="admin-dashboard__section-title">{t('admin.recentActivity')}</h2>
          </div>
          <div className="admin-dashboard__empty">
            <span className="admin-dashboard__empty-icon" aria-hidden>
              <i className="fa-regular fa-clock" />
            </span>
            <p className="admin-dashboard__empty-title">{t('admin.noActivityTitle')}</p>
            <p className="admin-dashboard__empty-text">{t('admin.noActivity')}</p>
            <Link to="/admin/news/create/latest" className="admin-dashboard__empty-cta">
              {t('admin.createNews')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
