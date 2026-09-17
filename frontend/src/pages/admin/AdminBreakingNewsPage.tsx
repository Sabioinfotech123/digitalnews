import { App, Dropdown, Form, Input, InputNumber, Modal, Select, Space, Switch, Tooltip, type MenuProps, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createBreakingNews,
  deleteBreakingNews,
  fetchAdminBreakingNews,
  updateBreakingNews,
} from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { BreakingNewsItem, ContentLanguage } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { confirmDelete } from '@/utils/confirmDelete'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

function resolveOpenUrl(link: string): string {
  const trimmed = link.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return `${window.location.origin}${trimmed}`
  return trimmed
}

function LinkActions({ url }: { url: string }) {
  const { message } = App.useApp()

  const items: MenuProps['items'] = [
    {
      key: 'copy',
      icon: <i className="fa-regular fa-copy" aria-hidden />,
      label: 'Copy',
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url)
          message.success('Link copied')
        } catch {
          message.error('Could not copy link')
        }
      },
    },
    {
      key: 'open',
      icon: <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />,
      label: 'Open',
      onClick: () => {
        window.open(resolveOpenUrl(url), '_blank', 'noopener,noreferrer')
      },
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottom">
      <AppButton
        type="text"
        size="small"
        aria-label="Link actions"
        className="app-table__icon-btn text-primary"
        icon={<i className="fa-solid fa-link" aria-hidden />}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  )
}

export function AdminBreakingNewsPage() {
  const { t } = useLanguage()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<BreakingNewsItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<BreakingNewsItem | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchAdminBreakingNews({ search: search || undefined }))
    } catch {
      message.error('Failed to load breaking news')
    } finally {
      setLoading(false)
    }
  }, [search, message])

  useEffect(() => {
    void load()
  }, [load])

  const openCreateModal = useCallback(() => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, language: 'en', sort_order: 0 })
    setOpen(true)
  }, [form])

  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    openCreateModal()
    navigate('/admin/breaking-news', { replace: true })
  }, [searchParams, openCreateModal, navigate])

  const openEditModal = (row: BreakingNewsItem) => {
    setEditing(row)
    form.setFieldsValue(row)
    setOpen(true)
  }

  const closeModal = () => {
    if (!saving) setOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteBreakingNews(id)
      message.success('Breaking news deleted successfully')
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const askDelete = (row: BreakingNewsItem) => {
    confirmDelete({
      modal,
      title: 'Delete breaking news?',
      content: `Delete “${row.title}”? This cannot be undone.`,
      onConfirm: () => handleDelete(row.id),
    })
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: {
    title: string
    language: ContentLanguage
    link_url?: string
    is_active?: boolean
    sort_order?: number
  }) => {
    setSaving(true)
    try {
      const payload = {
        ...values,
        link_url: values.link_url?.trim() || null,
      }
      if (editing) {
        await updateBreakingNews(editing.id, payload)
        message.success('Breaking news updated successfully')
      } else {
        await createBreakingNews(payload)
        message.success('Breaking news created successfully')
      }
      setOpen(false)
      void load()
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(getApiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const columns: TableColumnsType<BreakingNewsItem> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        sorter: (a, b) => compareText(a.title, b.title),
      },
      {
        title: 'Link',
        dataIndex: 'link_url',
        width: 90,
        align: 'center',
        sorter: (a, b) => Number(Boolean(b.link_url)) - Number(Boolean(a.link_url)),
        render: (link: string | null) =>
          link?.trim() ? <LinkActions url={link.trim()} /> : <span className="text-ink-muted">—</span>,
      },
      {
        title: 'Language',
        dataIndex: 'language',
        width: 110,
        sorter: (a, b) => compareText(a.language, b.language),
        render: (lang: ContentLanguage) => (lang === 'te' ? 'తెలుగు' : 'English'),
      },
      {
        title: 'Order',
        dataIndex: 'sort_order',
        width: 90,
        sorter: (a, b) => a.sort_order - b.sort_order,
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        width: 120,
        sorter: (a, b) => Number(b.is_active) - Number(a.is_active),
        render: (active: boolean) => <StatusBadge status={active ? 'active' : 'inactive'} />,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        align: 'center',
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="Edit">
              <AppButton
                type="text"
                aria-label="Edit"
                className="app-table__icon-btn app-table__icon-btn--edit"
                icon={<i className="fa-solid fa-pen-to-square" aria-hidden />}
                onClick={() => openEditModal(row)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [load, message],
  )

  return (
    <>
      <AppLoader fullscreen spinning={saving} tip="Saving…" />
      <AppTable<BreakingNewsItem>
        title={t('admin.breakingNews')}
        loading={loading}
        dataSource={items}
        columns={columns}
        onRefresh={() => void load()}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search breaking news…"
        toolbar={
          <AppButton
            type="primary"
            icon={<i className="fa-solid fa-plus" aria-hidden />}
            onClick={openCreateModal}
          >
            Add breaking news
          </AppButton>
        }
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit breaking news' : 'Add breaking news'}
        open={open}
        onCancel={closeModal}
        onOk={form.submit}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          disabled={saving}
          onFinishFailed={handleFinishFailed}
          onFinish={handleFinish}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 3, max: 300 }]}>
            <Input.TextArea rows={2} maxLength={300} showCount />
          </Form.Item>
          <Form.Item name="language" label="Language" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'en', label: 'English' },
                { value: 'te', label: 'తెలుగు' },
              ]}
            />
          </Form.Item>
          <Form.Item name="link_url" label="Link URL (optional)">
            <Input placeholder="https://… or /news/slug" />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort order">
            <InputNumber className="w-full" min={0} precision={0} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
