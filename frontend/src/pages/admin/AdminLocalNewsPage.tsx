import { App, DatePicker, Modal, Select, Space, Tooltip, Typography, type TableColumnsType } from 'antd'
import type { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchLocalNews, fetchLocalNewsStates, fetchVerifiedNewsById, verifyLocalNews } from '@/api/localNews'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { LocalNewsArticle, LocalNewsStateOption, VerifiedLocalNewsItem } from '@/types/localNews'
import { getApiErrorMessage } from '@/utils/apiError'
import './AdminLocalNewsPage.scss'

const { Paragraph, Text } = Typography

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

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  const [dateFrom, setDateFrom] = useState<string | undefined>()
  const [dateTo, setDateTo] = useState<string | undefined>()
  const [items, setItems] = useState<LocalNewsArticle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState('google-news-rss')

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyTarget, setVerifyTarget] = useState<LocalNewsArticle | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifiedLocalNewsItem | null>(null)

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
      const data = await fetchLocalNews({
        state,
        q: search || undefined,
        from_date: dateFrom,
        to_date: dateTo,
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
  }, [state, search, dateFrom, dateTo, page, pageSize, message])

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

  const handleRangeChange = (
    value: [Dayjs | null, Dayjs | null] | null,
    _dateStrings: [string, string],
  ) => {
    setPage(1)
    setRange(value)
    if (value?.[0]?.isValid?.() && value?.[1]?.isValid?.()) {
      setDateFrom(value[0].format('YYYY-MM-DD'))
      setDateTo(value[1].format('YYYY-MM-DD'))
      return
    }
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const handlePageChange = (nextPage: number, nextSize: number) => {
    setPage(nextPage)
    setPageSize(nextSize)
  }

  const goToView = (row: LocalNewsArticle) => {
    navigate(`/admin/local-news/${row.id}`)
  }

  const openVerify = async (row: LocalNewsArticle) => {
    setVerifyTarget(row)
    setVerifyResult(null)
    setVerifyOpen(true)
    if (row.verified_id) {
      try {
        const existing = await fetchVerifiedNewsById(row.verified_id)
        setVerifyResult(existing)
      } catch {
        // List still shows Verified; modal can re-run if detail fetch fails.
      }
    }
  }

  const runVerify = async () => {
    if (!verifyTarget) return
    setVerifying(true)
    try {
      const result = await verifyLocalNews(verifyTarget.id)
      setVerifyResult(result.item)
      setItems((prev) =>
        prev.map((item) =>
          item.id === verifyTarget.id
            ? {
                ...item,
                is_verified: true,
                verified_id: result.item.id,
                verdict: result.item.verdict,
              }
            : item,
        ),
      )
      message.success('AI verification complete')
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Verification failed'))
    } finally {
      setVerifying(false)
    }
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
        title: 'Google News',
        key: 'provider',
        width: 130,
        render: () => (provider === 'newsapi' ? 'NewsAPI' : 'Google News'),
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
        width: 280,
        align: 'center',
        fixed: 'right',
        render: (_, row) => (
          <Space size={6} wrap>
            <AppButton
              type={row.is_verified ? 'primary' : 'default'}
              size="small"
              className={
                row.is_verified
                  ? 'admin-local-news__action-btn admin-local-news__action-btn--verified'
                  : 'admin-local-news__action-btn'
              }
              onClick={() => void openVerify(row)}
            >
              {row.is_verified ? 'Verified' : 'Verify'}
            </AppButton>
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
    [navigate, provider],
  )

  const pageHint =
    `Local/regional press for your state (not TV channels). Verify with AI, or add to CMS. Provider: ${provider}.`

  return (
    <>
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

      <Modal
        title="Verify news"
        open={verifyOpen}
        onCancel={() => {
          if (verifying) return
          setVerifyOpen(false)
        }}
        footer={null}
        width={640}
        destroyOnHidden
        maskClosable={!verifying}
        closable={!verifying}
      >
        {verifyTarget ? (
          <div className="admin-local-news-verify">
            <Paragraph className="admin-local-news-verify__title">{verifyTarget.title}</Paragraph>
            <Text type="secondary">
              {verifyTarget.source_name || 'Unknown source'} ·{' '}
              {formatDateTime(verifyTarget.published_at)}
              {verifyTarget.country ? ` · ${verifyTarget.country}` : ''}
            </Text>
            {verifyTarget.description ? (
              <Paragraph className="admin-local-news-verify__desc">{verifyTarget.description}</Paragraph>
            ) : null}
            <Paragraph type="secondary" className="admin-local-news-verify__url">
              {verifyTarget.url}
            </Paragraph>

            <div className="admin-local-news-verify__status">
              <Text strong>Verify status</Text>
              {verifyResult ? (
                <div className="admin-local-news-verify__result">
                  <Space wrap>
                    <StatusBadge status={verifyResult.verdict} />
                    <Text type="secondary">
                      {verifyResult.confidence}% · {verifyResult.ai_provider}
                    </Text>
                  </Space>
                  <Paragraph className="admin-local-news-verify__summary">
                    {verifyResult.ai_summary}
                  </Paragraph>
                </div>
              ) : (
                <Paragraph type="secondary" className="admin-local-news-verify__hint">
                  Run AI verification. Result is saved under Verified news.
                </Paragraph>
              )}
            </div>

            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <AppButton
                className="admin-local-news__action-btn"
                block
                disabled={verifying}
                onClick={() => {
                  setVerifyOpen(false)
                  navigate('/admin/verified-news')
                }}
              >
                Open Verified list
              </AppButton>
              {!verifyResult ? (
                <AppButton
                  type="primary"
                  className="btn-soft-primary"
                  block
                  loading={verifying}
                  onClick={() => void runVerify()}
                >
                  {verifying ? 'Verifying…' : 'Run AI verify'}
                </AppButton>
              ) : (
                <AppButton block onClick={() => setVerifyOpen(false)}>
                  Close
                </AppButton>
              )}
            </Space>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
