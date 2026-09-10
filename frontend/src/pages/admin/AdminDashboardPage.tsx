import { Card, Col, Row, Statistic, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { fetchDashboardStats } from '@/api/auth'
import type { DashboardStats } from '@/types/auth'
import './AdminDashboardPage.scss'

const { Title, Paragraph } = Typography

const emptyStats: DashboardStats = {
  total_news: 0,
  published_news: 0,
  draft_news: 0,
  total_blogs: 0,
  total_videos: 0,
  total_users: 0,
  total_views: 0,
}

export function AdminDashboardPage() {
  const { t } = useLanguage()
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

  const cards = [
    { key: 'total_news', title: t('admin.totalNews'), value: stats.total_news, icon: 'fa-newspaper' },
    { key: 'published_news', title: t('admin.publishedNews'), value: stats.published_news, icon: 'fa-circle-check' },
    { key: 'draft_news', title: t('admin.draftNews'), value: stats.draft_news, icon: 'fa-file-pen' },
    { key: 'total_blogs', title: t('admin.totalBlogs'), value: stats.total_blogs, icon: 'fa-blog' },
    { key: 'total_videos', title: t('admin.totalVideos'), value: stats.total_videos, icon: 'fa-video' },
    { key: 'total_users', title: t('admin.totalUsers'), value: stats.total_users, icon: 'fa-users' },
    { key: 'total_views', title: t('admin.totalViews'), value: stats.total_views, icon: 'fa-eye' },
  ]

  return (
    <div className="admin-dashboard">
      <Title level={3} className="admin-dashboard__title">
        {t('admin.dashboard')}
      </Title>

      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={card.key}>
            <Card className="admin-dashboard__stat" loading={loading}>
              <div className="admin-dashboard__stat-icon" aria-hidden>
                <i className={`fa-solid ${card.icon}`} />
              </div>
              <Statistic title={card.title} value={card.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="admin-dashboard__activity" title={t('admin.recentActivity')}>
        <Paragraph type="secondary" className="mb-0">
          {t('admin.noActivity')}
        </Paragraph>
      </Card>
    </div>
  )
}
