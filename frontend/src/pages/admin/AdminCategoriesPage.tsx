import { App, Form, Input, Modal, Popconfirm, Space, Switch, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Category } from '@/types/content'
import { slugify } from '@/utils/slugify'

export function AdminCategoriesPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const [items, setItems] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
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

  const columns: TableColumnsType<Category> = useMemo(
    () => [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Slug', dataIndex: 'slug' },
      {
        title: 'Status',
        dataIndex: 'is_active',
        width: 120,
        render: (active: boolean) => <StatusBadge status={active ? 'active' : 'inactive'} />,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 160,
        render: (_, row) => (
          <Space>
            <AppButton
              type="link"
              onClick={() => {
                setEditing(row)
                form.setFieldsValue(row)
                setOpen(true)
              }}
            >
              Edit
            </AppButton>
            <Popconfirm
              title="Delete category?"
              onConfirm={async () => {
                await deleteCategory(row.id)
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
    [form, load, message],
  )

  return (
    <>
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
            onClick={() => {
              setEditing(null)
              form.resetFields()
              form.setFieldsValue({ is_active: true })
              setOpen(true)
            }}
          >
            Add category
          </AppButton>
        }
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit category' : 'Add category'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed, all) => {
            if ('name' in changed && !editing) {
              form.setFieldValue('slug', slugify(String(all.name || '')))
            }
          }}
          onFinish={async (values) => {
            try {
              if (editing) {
                await updateCategory(editing.id, values)
                message.success('Updated')
              } else {
                await createCategory(values)
                message.success('Created')
              }
              setOpen(false)
              void load()
            } catch {
              message.error('Save failed')
            }
          }}
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
