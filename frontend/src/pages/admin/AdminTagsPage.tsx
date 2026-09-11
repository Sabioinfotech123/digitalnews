import { App, Form, Input, Modal, Popconfirm, Space, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTag, deleteTag, fetchTags, updateTag } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { AppTable } from '@/components/common/AppTable'
import type { TagItem } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

export function AdminTagsPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const [items, setItems] = useState<TagItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<TagItem | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchTags(search || undefined))
    } catch {
      message.error('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }, [search, message])

  useEffect(() => {
    void load()
  }, [load])

  const openCreateModal = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const openEditModal = (row: TagItem) => {
    setEditing(row)
    form.setFieldsValue(row)
    setOpen(true)
  }

  const closeModal = () => {
    if (!saving) setOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id)
      message.success('Deleted')
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const handleValuesChange = (changed: Record<string, unknown>, all: Record<string, unknown>) => {
    if ('name' in changed && !editing) {
      form.setFieldValue('slug', slugify(String(all.name || '')))
    }
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: { name: string; slug: string }) => {
    setSaving(true)
    try {
      if (editing) {
        await updateTag(editing.id, values)
        message.success('Updated')
      } else {
        await createTag(values)
        message.success('Created')
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

  const columns: TableColumnsType<TagItem> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        sorter: (a, b) => compareText(a.name, b.name),
      },
      {
        title: 'Slug',
        dataIndex: 'slug',
        sorter: (a, b) => compareText(a.slug, b.slug),
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
            <Popconfirm
              title="Delete tag?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(row.id)}
            >
              <Tooltip title="Delete">
                <AppButton
                  type="text"
                  aria-label="Delete"
                  className="app-table__icon-btn app-table__icon-btn--delete"
                  icon={<i className="fa-solid fa-trash-can" aria-hidden />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // Handlers close over latest state; columns rebuilt when load/message change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [load, message],
  )

  return (
    <>
      <AppLoader fullscreen spinning={saving} tip="Saving…" />
      <AppTable<TagItem>
        title={t('admin.tags')}
        loading={loading}
        dataSource={items}
        columns={columns}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tags…"
        toolbar={
          <AppButton
            type="primary"
            icon={<i className="fa-solid fa-plus" aria-hidden />}
            onClick={openCreateModal}
          >
            Add tag
          </AppButton>
        }
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit tag' : 'Add tag'}
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
          onValuesChange={handleValuesChange}
          onFinishFailed={handleFinishFailed}
          onFinish={handleFinish}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
