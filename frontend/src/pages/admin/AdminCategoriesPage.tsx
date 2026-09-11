import { App, Form, Input, Modal, Space, Switch, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Category } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { confirmDelete } from '@/utils/confirmDelete'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

export function AdminCategoriesPage() {
  const { t } = useLanguage()
  const { message, modal } = App.useApp()
  const [items, setItems] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchCategories(search || undefined))
    } catch {
      message.error('Failed to load categories')
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
    form.setFieldsValue({ is_active: true })
    setOpen(true)
  }

  const openEditModal = (row: Category) => {
    setEditing(row)
    form.setFieldsValue(row)
    setOpen(true)
  }

  const closeModal = () => {
    if (!saving) setOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)
      message.success('Category deleted successfully')
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const askDelete = (row: Category) => {
    confirmDelete({
      modal,
      title: 'Delete category?',
      content: `Delete “${row.name}”? This cannot be undone.`,
      onConfirm: () => handleDelete(row.id),
    })
  }

  const handleValuesChange = (changed: Record<string, unknown>, all: Record<string, unknown>) => {
    if ('name' in changed && !editing) {
      form.setFieldValue('slug', slugify(String(all.name || '')))
    }
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: {
    name: string
    slug: string
    description?: string
    is_active?: boolean
  }) => {
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, values)
        message.success('Category updated successfully')
      } else {
        await createCategory(values)
        message.success('Category created successfully')
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

  const columns: TableColumnsType<Category> = useMemo(
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
      <AppTable<Category>
        title={t('admin.categories')}
        loading={loading}
        dataSource={items}
        columns={columns}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories…"
        toolbar={
          <AppButton
            type="primary"
            icon={<i className="fa-solid fa-plus" aria-hidden />}
            onClick={openCreateModal}
          >
            Add category
          </AppButton>
        }
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit category' : 'Add category'}
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
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
