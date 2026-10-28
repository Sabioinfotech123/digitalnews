import { App, Modal, Select, Space, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAdminVideo, fetchAdminVideos } from '@/api/content'
import {
  deleteAdminVideoComment,
  fetchAdminVideoComments,
  type VideoCommentItem,
} from '@/api/videoEngagement'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { LanguageBadge } from '@/components/common/LanguageBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { ContentLanguage, ContentStatus, VideoItem } from '@/types/content'
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

function sourceLabel(row: VideoItem) {
  const hasFile = Boolean(row.video_url?.trim())
  const hasYt = Boolean(row.youtube_url?.trim())
  if (hasFile && hasYt) return 'File + YouTube'
  if (hasFile) return 'Uploaded'
  if (hasYt) return 'YouTube'
  return '—'
}

type AdminVideosPageProps = {
  /** When true, list only short-form (9:16) videos */
  shortsOnly?: boolean
}

export function AdminVideosPage({ shortsOnly = false }: AdminVideosPageProps) {
  const { t } = useLanguage()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const [items, setItems] = useState<VideoItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<ContentLanguage | 'all'>('all')
  const [status, setStatus] = useState<ContentStatus | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsVideo, setCommentsVideo] = useState<VideoItem | null>(null)
  const [comments, setComments] = useState<VideoCommentItem[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminVideos({
        page,
        page_size: pageSize,
        search: search || undefined,
        language: language === 'all' ? undefined : language,
        status: status === 'all' ? undefined : status,
        is_short: shortsOnly ? true : undefined,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch {
      message.error('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, language, status, shortsOnly, message])

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
    navigate(shortsOnly ? '/admin/shorts/create' : '/admin/videos/create')
  }

  const goToEdit = (row: VideoItem) => {
    const short = shortsOnly || row.is_short
    navigate(short ? `/admin/shorts/edit/${row.id}` : `/admin/videos/edit/${row.id}`)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminVideo(id)
      message.success('Video deleted successfully')
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const openCommentsModal = async (row: VideoItem) => {
    setCommentsVideo(row)
    setCommentsOpen(true)
    setCommentsLoading(true)
    try {
      const list = await fetchAdminVideoComments(row.id)
      setComments(list)
    } catch {
      message.error('Could not load comments')
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!commentsVideo) return
    try {
      await deleteAdminVideoComment(commentId)
      message.success('Comment removed')
      const list = await fetchAdminVideoComments(commentsVideo.id)
      setComments(list)
      setItems((prev) =>
        prev.map((row) =>
          row.id === commentsVideo.id
            ? { ...row, comment_count: Math.max(0, list.length) }
            : row,
        ),
      )
    } catch {
      message.error('Could not delete comment')
    }
  }

  const askDelete = (row: VideoItem) => {
    confirmDelete({
      modal,
      title: 'Delete this video?',
      content: `Delete “${row.title}”? This cannot be undone.`,
      onConfirm: () => handleDelete(row.id),
    })
  }

  const columns: TableColumnsType<VideoItem> = useMemo(
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
        title: 'Source',
        key: 'source',
        width: 140,
        render: (_, row) => sourceLabel(row),
      },
      ...(!shortsOnly
        ? [
            {
              title: 'Format',
              key: 'format',
              width: 90,
              render: (_: unknown, row: VideoItem) =>
                row.is_short ? (
                  <span className="text-xs font-semibold text-primary">Short</span>
                ) : (
                  <span className="text-xs text-ink-muted">Long</span>
                ),
            } as const,
          ]
        : []),
      {
        title: 'Language',
        dataIndex: 'language',
        width: 110,
        sorter: (a, b) => compareText(a.language, b.language),
        render: (value: string) => <LanguageBadge language={value} />,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        sorter: (a, b) => compareText(a.status, b.status),
        render: (value: string) => <StatusBadge status={value} />,
      },
      ...(shortsOnly
        ? [
            {
              title: 'Likes',
              dataIndex: 'like_count',
              width: 80,
              align: 'center' as const,
              sorter: (a: VideoItem, b: VideoItem) => a.like_count - b.like_count,
              render: (value: number) => (
                <span className="font-ui tabular-nums text-ink">{value ?? 0}</span>
              ),
            },
            {
              title: 'Comments',
              key: 'comments',
              width: 100,
              align: 'center' as const,
              sorter: (a: VideoItem, b: VideoItem) => a.comment_count - b.comment_count,
              render: (_: unknown, row: VideoItem) => (
                <AppButton
                  type="link"
                  className="!px-1 tabular-nums"
                  onClick={() => void openCommentsModal(row)}
                >
                  {row.comment_count ?? 0}
                </AppButton>
              ),
            },
          ]
        : []),
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
    [load, message, modal, navigate, shortsOnly],
  )

  return (
    <>
    <AppTable<VideoItem>
      title={shortsOnly ? t('admin.shorts') : t('admin.videos')}
      loading={loading}
      dataSource={items}
      columns={columns}
      rowKey="id"
      onRefresh={() => void load()}
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
          {shortsOnly ? t('videos.createShort') : 'Create video'}
        </AppButton>
      }
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: handlePageChange,
      }}
    />

    <Modal
      title={commentsVideo ? `Comments — ${commentsVideo.title}` : 'Comments'}
      open={commentsOpen}
      onCancel={() => setCommentsOpen(false)}
      footer={null}
      width={520}
      destroyOnClose
    >
      {commentsLoading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-ink-muted">No comments on this short yet.</p>
      ) : (
        <ul className="m-0 max-h-[360px] list-none overflow-y-auto p-0">
          {comments.map((c) => (
            <li
              key={c.id}
              className="mb-3 border-b border-border pb-3 last:mb-0 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <strong className="font-ui text-sm text-ink">{c.author_name}</strong>
                  <p className="m-0 mt-1 text-sm text-ink-muted">{c.body}</p>
                  <time className="mt-1 block text-xs text-ink-muted">
                    {formatUpdatedAt(c.created_at)}
                  </time>
                </div>
                <AppButton
                  size="small"
                  danger
                  onClick={() => void handleDeleteComment(c.id)}
                >
                  Delete
                </AppButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
    </>
  )
}
