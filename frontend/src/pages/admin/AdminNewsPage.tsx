import { App, Popconfirm, Select, Space, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAdminNews, fetchAdminNews } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { LanguageBadge } from '@/components/common/LanguageBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { ContentLanguage, ContentStatus, NewsItem, NewsType } from '@/types/content'
import { NEWS_TYPES } from '@/types/content'

const TYPE_LABELS: Record<NewsType, string> = {
  featured: 'Featured news',
  latest: 'Latest news',
  trending: 'Trending news',
  more: 'More news',
}

interface AdminNewsPageProps {
  newsType?: NewsType
}

export function AdminNewsPage({ newsType }: AdminNewsPageProps) {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [items, setItems] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<ContentLanguage | 'all'>('all')
  const [status, setStatus] = useState<ContentStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<NewsType | 'all'>(newsType ?? 'all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTypeFilter(newsType ?? 'all')
    setPage(1)
  }, [newsType])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminNews({
        page,
        page_size: pageSize,
        search: search || undefined,
        language: language === 'all' ? undefined : language,
        status: status === 'all' ? undefined : status,
        news_type: newsType ?? (typeFilter === 'all' ? undefined : typeFilter),
      })
      setItems(data.items)
      setTotal(data.total)
    } catch {
      message.error('Failed to load news')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, language, status, newsType, typeFilter, message])

  useEffect(() => {
    void load()
  }, [load])

  const createPath = newsType ? `/admin/news/create/${newsType}` : '/admin/news/create/latest'
  const title = newsType ? TYPE_LABELS[newsType] : t('admin.news')

  const columns: TableColumnsType<NewsItem> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (value: string, row) => (
          <div>
            <div className="font-ui font-semibold text-ink">{value}</div>
            <div className="text-xs text-ink-muted">{row.slug}</div>
          </div>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'news_type',
        width: 110,
        render: (value: string) => <StatusBadge status={value} />,
      },
      {
        title: 'Language',
        dataIndex: 'language',
        width: 110,
        render: (value: string) => <LanguageBadge language={value} />,
      },
      {
        title: 'Category',
        dataIndex: 'category_name',
        width: 140,
        render: (value: string | null) => value || '—',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (value: string) => <StatusBadge status={value} />,
      },
      {
        title: 'Flags',
        key: 'flags',
        width: 120,
        render: (_, row) => (
          <Space size={4} wrap>
            {row.is_breaking ? <StatusBadge status="breaking" /> : null}
          </Space>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 160,
        render: (_, row) => (
          <Space>
            <AppButton type="link" onClick={() => navigate(`/admin/news/edit/${row.id}`)}>
              Edit
            </AppButton>
            <Popconfirm
              title="Delete this news?"
              onConfirm={async () => {
                await deleteAdminNews(row.id)
                message.success('Deleted')
                void load()
              }}
            >
              <AppButton type="link" danger>
                Delete
              </AppButton>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [load, message, navigate],
  )

  return (
    <AppTable<NewsItem>
      title={title}
      loading={loading}
      dataSource={items}
      columns={columns}
      rowKey="id"
      searchValue={search}
      searchPlaceholder="Search title or slug…"
      onSearchChange={(value) => {
        setPage(1)
        setSearch(value)
      }}
      searchExtra={
        <Space wrap>
          {!newsType ? (
            <Select
              value={typeFilter}
              style={{ width: 150 }}
              onChange={(value: NewsType | 'all') => {
                setPage(1)
                setTypeFilter(value)
              }}
              options={[{ value: 'all', label: 'All types' }, ...NEWS_TYPES]}
            />
          ) : null}
          <Select
            value={language}
            style={{ width: 140 }}
            onChange={(value: ContentLanguage | 'all') => {
              setPage(1)
              setLanguage(value)
            }}
            options={[
              { value: 'all', label: 'All languages' },
              { value: 'en', label: 'English' },
              { value: 'te', label: 'తెలుగు' },
            ]}
          />
          <Select
            value={status}
            style={{ width: 150 }}
            onChange={(value: ContentStatus | 'all') => {
              setPage(1)
              setStatus(value)
            }}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'unpublished', label: 'Unpublished' },
              { value: 'scheduled', label: 'Scheduled' },
            ]}
          />
        </Space>
      }
      toolbar={
        <AppButton
          type="primary"
          icon={<i className="fa-solid fa-plus" aria-hidden />}
          onClick={() => navigate(createPath)}
        >
          Create {newsType ? TYPE_LABELS[newsType].toLowerCase() : 'news'}
        </AppButton>
      }
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: (nextPage, nextSize) => {
          setPage(nextPage)
          setPageSize(nextSize)
        },
      }}
    />
  )
}

export function AdminFeaturedNewsPage() {
  return <AdminNewsPage newsType="featured" />
}

export function AdminLatestNewsPage() {
  return <AdminNewsPage newsType="latest" />
}

export function AdminTrendingNewsPage() {
  return <AdminNewsPage newsType="trending" />
}

export function AdminMoreNewsPage() {
  return <AdminNewsPage newsType="more" />
}
