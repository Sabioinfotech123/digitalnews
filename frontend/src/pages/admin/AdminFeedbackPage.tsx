import {
  App,
  Descriptions,
  Form,
  Input,
  Modal,
  Rate,
  Select,
  Space,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteFeedback, fetchAdminFeedback, updateFeedback } from '@/api/feedback'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { FeedbackCategory, FeedbackItem, FeedbackStatus } from '@/types/feedback'
import { getApiErrorMessage } from '@/utils/apiError'
import { confirmDelete } from '@/utils/confirmDelete'
import './AdminFeedbackPage.scss'

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  general: 'General',
  suggestion: 'Suggestion',
  bug: 'Bug / problem',
  content: 'News content',
  other: 'Other',
}

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
]

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type ReviewValues = { status: FeedbackStatus; admin_note?: string }

export function AdminFeedbackPage() {
  const { t } = useLanguage()
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<ReviewValues>()

  const [items, setItems] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState<FeedbackItem | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminFeedback({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      })
      setItems(data.items)
      setTotal(data.total)
      setNewCount(data.new_count)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to load feedback'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, categoryFilter, message])

  useEffect(() => {
    void load()
  }, [load])

  const openView = useCallback(
    (row: FeedbackItem) => {
      setViewing(row)
      form.setFieldsValue({ status: row.status, admin_note: row.admin_note ?? '' })
    },
    [form],
  )

  const closeView = () => {
    if (!saving) setViewing(null)
  }

  const handleSave = async (values: ReviewValues) => {
    if (!viewing) return
    setSaving(true)
    try {
      await updateFeedback(viewing.id, {
        status: values.status,
        admin_note: values.admin_note?.trim() || null,
      })
      message.success('Feedback updated')
      setViewing(null)
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const askDelete = useCallback(
    (row: FeedbackItem) => {
      confirmDelete({
        modal,
        title: 'Delete feedback?',
        content: `Delete feedback from “${row.name}”? This cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteFeedback(row.id)
            message.success('Feedback deleted')
            setViewing((current) => (current?.id === row.id ? null : current))
            void load()
          } catch (err) {
            message.error(getApiErrorMessage(err, 'Delete failed'))
          }
        },
      })
    },
    [modal, message, load],
  )

  const columns: TableColumnsType<FeedbackItem> = useMemo(
    () => [
      {
        title: 'From',
        key: 'from',
        width: 240,
        render: (_, row) => (
          <div className="admin-feedback__from">
            <span
              className={`admin-feedback__avatar${row.user_id ? ' admin-feedback__avatar--user' : ''}`}
              aria-hidden
            >
              {row.name.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <div className="admin-feedback__from-text">
              <div className="admin-feedback__name">{row.name}</div>
              <div className="admin-feedback__email" title={row.email}>
                {row.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Type',
        key: 'type',
        width: 90,
        render: (_, row) =>
          row.user_id ? <Tag color="blue">User</Tag> : <Tag>Guest</Tag>,
      },
      {
        title: 'Message',
        dataIndex: 'message',
        key: 'message',
        width: 360,
        render: (value: string, row) => (
          <button
            type="button"
            className="admin-feedback__msg"
            title="Open full message"
            onClick={() => openView(row)}
          >
            {value}
          </button>
        ),
      },
      {
        title: 'Topic',
        dataIndex: 'category',
        key: 'category',
        width: 130,
        render: (value: FeedbackCategory) => CATEGORY_LABEL[value] ?? value,
      },
      {
        title: 'Rating',
        dataIndex: 'rating',
        key: 'rating',
        width: 140,
        sorter: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
        render: (value: number | null) =>
          value ? <Rate disabled value={value} className="admin-feedback__rate" /> : '—',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value: string) => <StatusBadge status={value} />,
      },
      {
        title: 'Received',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 140,
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (value: string) => {
          const date = new Date(value)
          if (Number.isNaN(date.getTime())) return '—'
          return (
            <div className="admin-feedback__when">
              <div className="admin-feedback__date">
                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="admin-feedback__time">
                {date
                  .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                  .toUpperCase()}
              </div>
            </div>
          )
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 110,
        align: 'center',
        fixed: 'right',
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="View & reply note">
              <AppButton
                type="text"
                aria-label="View"
                className="app-table__icon-btn app-table__icon-btn--edit"
                icon={<i className="fa-regular fa-eye" aria-hidden />}
                onClick={() => openView(row)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <AppButton
                type="text"
                aria-label="Delete"
                className="app-table__icon-btn app-table__icon-btn--delete"
                icon={<i className="fa-solid fa-trash-can" aria-hidden />}
                onClick={() => askDelete(row)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [openView, askDelete],
  )

  return (
    <>
      <AppTable<FeedbackItem>
        title={
          <span className="admin-feedback__title">
            {t('admin.feedback')}
            {newCount > 0 ? <Tag color="processing">{newCount} new</Tag> : null}
          </span>
        }
        loading={loading}
        dataSource={items}
        columns={columns}
        rowKey="id"
        onRefresh={() => void load()}
        searchValue={search}
        searchPlaceholder="Search name, email or message…"
        onSearchChange={(value) => {
          setPage(1)
          setSearch(value)
        }}
        searchExtra={
          <Space wrap>
            <Select
              value={statusFilter}
              style={{ width: 150 }}
              onChange={(value) => {
                setPage(1)
                setStatusFilter(value)
              }}
              options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]}
            />
            <Select
              value={categoryFilter}
              style={{ width: 160 }}
              onChange={(value) => {
                setPage(1)
                setCategoryFilter(value)
              }}
              options={[
                { value: 'all', label: 'All topics' },
                ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
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

      <Modal
        title="Feedback details"
        open={Boolean(viewing)}
        onCancel={closeView}
        onOk={form.submit}
        okText="Save"
        confirmLoading={saving}
        width={640}
        destroyOnHidden
      >
        {viewing ? (
          <>
            <Descriptions column={1} size="small" bordered className="admin-feedback__details">
              <Descriptions.Item label="From">
                {viewing.name} {viewing.user_id ? <Tag color="blue">User</Tag> : <Tag>Guest</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <a href={`mailto:${viewing.email}`}>{viewing.email}</a>
              </Descriptions.Item>
              <Descriptions.Item label="Topic">{CATEGORY_LABEL[viewing.category] ?? viewing.category}</Descriptions.Item>
              <Descriptions.Item label="Rating">
                {viewing.rating ? <Rate disabled value={viewing.rating} className="admin-feedback__rate" /> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Sent from page">
                {viewing.page_url ? (
                  <a href={viewing.page_url} target="_blank" rel="noopener noreferrer">
                    {viewing.page_url}
                  </a>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Received">{formatDateTime(viewing.created_at)}</Descriptions.Item>
            </Descriptions>

            <div className="admin-feedback__message">{viewing.message}</div>

            <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSave}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
              <Form.Item label="Internal note (only admins see this)" name="admin_note" rules={[{ max: 2000 }]}>
                <Input.TextArea rows={3} showCount maxLength={2000} placeholder="e.g. Fixed in today's update" />
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Modal>
    </>
  )
}
