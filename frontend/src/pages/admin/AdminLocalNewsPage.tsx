import { App, DatePicker, Select, Space, Tooltip, type TableColumnsType } from 'antd'
import type { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchLocalNews, fetchLocalNewsStates } from '@/api/localNews'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import type { LocalNewsArticle, LocalNewsStateOption } from '@/types/localNews'
import { getApiErrorMessage } from '@/utils/apiError'
import './AdminLocalNewsPage.scss'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

function formatPublished(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AdminLocalNewsPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [states, setStates] = useState<LocalNewsStateOption[]>([])
  const [state, setState] = useState('Telangana')
  const [search, setSearch] = useState('')
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [items, setItems] = useState<LocalNewsArticle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState('google-news-rss')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchLocalNewsStates()
        if (!active) return
        setStates(data)
      } catch {
        if (active) {
          setStates([{ value: 'Telangana', label: 'Telangana' }])
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const fromDate = range?.[0]?.format('YYYY-MM-DD')
      const toDate = range?.[1]?.format('YYYY-MM-DD')
      const data = await fetchLocalNews({
        state,
        q: search || undefined,
        from_date: fromDate,
        to_date: toDate,
        page,
        page_size: pageSize,
      })
      setItems(data.items)
      setTotal(data.total)
      setProvider(data.provider)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load local news'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [state, search, range, page, pageSize, message])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearchChange = (value: string) => {
    setPage(1)
    setSearch(value)
  }

  const handleStateChange = (value: string) => {
    setPage(1)
    setState(value)
  }

  const handleRangeChange = (value: [Dayjs | null, Dayjs | null] | null) => {
    setPage(1)
    setRange(value)
  }

  const handlePageChange = (nextPage: number, nextSize: number) => {
    setPage(nextPage)
    setPageSize(nextSize)
  }

  const goToView = (row: LocalNewsArticle) => {
    navigate(`/admin/local-news/${row.id}`)
  }

  const columns: TableColumnsType<LocalNewsArticle> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        sorter: (a, b) => compareText(a.title, b.title),
        sortDirections: ['ascend', 'descend'],
        render: (value: string, row) => (
          <div>
            <div className="font-ui font-semibold text-ink">{value}</div>
            <div className="text-xs text-ink-muted">{row.source_name || '—'}</div>
          </div>
        ),
      },
      {
        title: 'Country',
        dataIndex: 'country',
        key: 'country',
        width: 120,
        sorter: (a, b) => compareText(a.country, b.country),
        render: (value: string | null) => value || '—',
      },
      {
        title: 'Published',
        dataIndex: 'published_at',
        key: 'published_at',
        width: 130,
        sorter: (a, b) =>
          new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime(),
        defaultSortOrder: 'descend',
        render: (value: string | null) => formatPublished(value),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 170,
        align: 'center',
        fixed: 'right',
        render: (_, row) => (
          <Space size={6}>
            <AppButton
              type="default"
              size="small"
              className="admin-local-news__action-btn"
              onClick={() => goToView(row)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate],
  )

  const pageHint =
    `Local/regional press for your state (not TV channels). Add as Featured, Latest, Trending, or More. Provider: ${provider}.`

  return (
    <AppTable<LocalNewsArticle>
      title={
        <span className="inline-flex items-center gap-2">
          {t('admin.localNews')}
          <Tooltip title={pageHint}>
            <i
              className="fa-solid fa-circle-info text-ink-muted cursor-help text-sm"
              aria-label="About local news"
            />
          </Tooltip>
        </span>
      }
      loading={loading}
      dataSource={items}
      columns={columns}
      rowKey="id"
      onRefresh={() => void load()}
      searchValue={search}
      searchPlaceholder="Search city or topic…"
      onSearchChange={handleSearchChange}
      searchExtra={
        <Space wrap>
          <Select
            value={state}
            style={{ width: 160 }}
            options={states.map((s) => ({ value: s.value, label: s.label }))}
            onChange={handleStateChange}
            aria-label="State"
          />
          <DatePicker.RangePicker
            value={range}
            onChange={handleRangeChange}
            allowClear
            format="DD MMM YYYY"
          />
        </Space>
      }
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: handlePageChange,
      }}
    />
  )
}
