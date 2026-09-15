import { App, Select, Space, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAdminBlog, fetchAdminBlogs } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { LanguageBadge } from '@/components/common/LanguageBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { BlogItem, ContentLanguage, ContentStatus } from '@/types/content'
import { getApiErrorMessage } from '@/utils/apiError'
import { confirmDelete } from '@/utils/confirmDelete'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AdminBlogsPage() {
  const { t } = useLanguage()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const [items, setItems] = useState<BlogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<ContentLanguage | 'all'>('all')
  const [status, setStatus] = useState<ContentStatus | 'all'>('all')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminBlogs({
        page,
        page_size: pageSize,
        search: search || undefined,
        language: language === 'all' ? undefined : language,
        status: status === 'all' ? undefined : status,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch {
      message.error('Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, language, status, message])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearchChange = (value: string) => {
    setPage(1)
    setSearch(value)
  }

  const handleLanguageChange = (value: ContentLanguage | 'all') => {
    setPage(1)
    setLanguage(value)
  }

  const handleStatusChange = (value: ContentStatus | 'all') => {
    setPage(1)
    setStatus(value)
  }

  const handlePageChange = (nextPage: number, nextSize: number) => {
    setPage(nextPage)
    setPageSize(nextSize)
  }

  const goToCreate = () => {
    navigate('/admin/blogs/create')
  }

  const goToEdit = (row: BlogItem) => {
    navigate(`/admin/blogs/edit/${row.id}`)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminBlog(id)
      message.success('Blog deleted successfully')
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const askDelete = (row: BlogItem) => {
    confirmDelete({
      modal,
      title: 'Delete this blog?',
      content: `Delete “${row.title}”? This cannot be undone.`,
      onConfirm: () => handleDelete(row.id),
    })
  }

  const columns: TableColumnsType<BlogItem> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        ellipsis: true,
        sorter: (a, b) => compareText(a.title, b.title),
        render: (value: string, row) => (
          <div>
            <div className="font-ui font-semibold text-ink">{value}</div>
            <div className="text-xs text-ink-muted">{row.slug}</div>
          </div>
        ),
      },
      {
        title: 'Language',
        dataIndex: 'language',
        width: 110,
        sorter: (a, b) => compareText(a.language, b.language),
        render: (value: string) => <LanguageBadge language={value} />,
      },
      {
        title: 'Category',
        dataIndex: 'category_name',
        width: 140,
        sorter: (a, b) => compareText(a.category_name, b.category_name),
        render: (value: string | null) => value || '—',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        sorter: (a, b) => compareText(a.status, b.status),
        render: (value: string) => <StatusBadge status={value} />,
      },
      {
        title: 'Updated',
        dataIndex: 'updated_at',
        width: 130,
        sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
        defaultSortOrder: 'descend',
        render: (value: string) => formatUpdatedAt(value),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="Edit">
              <AppButton
                type="text"
                aria-label="Edit"
                className="app-table__icon-btn app-table__icon-btn--edit"
                icon={<i className="fa-solid fa-pen-to-square" aria-hidden />}
                onClick={() => goToEdit(row)}
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
    [load, message, modal, navigate],
  )

  return (
    <AppTable<BlogItem>
      title={t('admin.blogs')}
      loading={loading}
      dataSource={items}
      columns={columns}
      rowKey="id"
      searchValue={search}
      searchPlaceholder="Search title or slug…"
      onSearchChange={handleSearchChange}
      searchExtra={
        <Space wrap>
          <Select
            value={language}
            style={{ width: 140 }}
            onChange={handleLanguageChange}
            options={[
              { value: 'all', label: 'All languages' },
              { value: 'en', label: 'English' },
              { value: 'te', label: 'తెలుగు' },
            ]}
          />
          <Select
            value={status}
            style={{ width: 150 }}
            onChange={handleStatusChange}
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
          onClick={goToCreate}
        >
          Create blog
        </AppButton>
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
