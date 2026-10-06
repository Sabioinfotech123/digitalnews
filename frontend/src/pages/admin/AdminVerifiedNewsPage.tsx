import { App, Select, Space, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchVerifiedNews } from '@/api/localNews'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { VerifiedLocalNewsItem } from '@/types/localNews'
import { getApiErrorMessage } from '@/utils/apiError'
import './AdminLocalNewsPage.scss'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

function formatVerifiedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AdminVerifiedNewsPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [items, setItems] = useState<VerifiedLocalNewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [verdict, setVerdict] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchVerifiedNews({
        page,
        page_size: pageSize,
        search: search || undefined,
        verdict: verdict === 'all' ? undefined : verdict,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load verified news'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, verdict, message])

  useEffect(() => {
    void load()
  }, [load])

  const columns: TableColumnsType<VerifiedLocalNewsItem> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        sorter: (a, b) => compareText(a.title, b.title),
        render: (value: string, row) => (
          <div>
            <div className="font-ui font-semibold text-ink">{value}</div>
            <div className="text-xs text-ink-muted">{row.source_name || '—'}</div>
          </div>
        ),
      },
      {
        title: 'Verdict',
        dataIndex: 'verdict',
        key: 'verdict',
        width: 140,
        sorter: (a, b) => compareText(a.verdict, b.verdict),
        render: (value: string) => <StatusBadge status={value} />,
      },
      {
        title: 'Confidence',
        dataIndex: 'confidence',
        key: 'confidence',
        width: 110,
        align: 'right',
        sorter: (a, b) => a.confidence - b.confidence,
        render: (value: number) => `${value}%`,
      },
      {
        title: 'AI',
        dataIndex: 'ai_provider',
        key: 'ai_provider',
        width: 100,
        sorter: (a, b) => compareText(a.ai_provider, b.ai_provider),
      },
      {
        title: 'Verified',
        dataIndex: 'verified_at',
        key: 'verified_at',
        width: 130,
        sorter: (a, b) => new Date(a.verified_at).getTime() - new Date(b.verified_at).getTime(),
        defaultSortOrder: 'descend',
        render: (value: string) => formatVerifiedAt(value),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 200,
        align: 'center',
        fixed: 'right',
        render: (_, row) => (
          <Space size={6} wrap>
            <AppButton
              type="default"
              size="small"
              className="admin-local-news__action-btn"
              onClick={() => navigate(`/admin/verified-news/${row.id}`)}
            >
              View & add
            </AppButton>
            <Tooltip title="Open original">
              <AppButton
                type="text"
                aria-label="Open original"
                className="app-table__icon-btn"
                icon={<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />}
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [navigate],
  )

  return (
    <AppTable<VerifiedLocalNewsItem>
      title={t('admin.verifiedNews')}
      loading={loading}
      dataSource={items}
      columns={columns}
      rowKey="id"
      onRefresh={() => void load()}
      searchValue={search}
      searchPlaceholder="Search title or source…"
      onSearchChange={(value) => {
        setPage(1)
        setSearch(value)
      }}
      searchExtra={
        <Space wrap>
          <Select
            value={verdict}
            style={{ width: 160 }}
            onChange={(value) => {
              setPage(1)
              setVerdict(value)
            }}
            options={[
              { value: 'all', label: 'All verdicts' },
              { value: 'likely_real', label: 'Likely real' },
              { value: 'likely_fake', label: 'Likely fake' },
              { value: 'uncertain', label: 'Uncertain' },
            ]}
          />
        </Space>
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
