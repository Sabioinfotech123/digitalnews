import { App, Form, Input, Modal, Popconfirm, Space, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTag, deleteTag, fetchTags, updateTag } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import type { TagItem } from '@/types/content'
import { slugify } from '@/utils/slugify'

export function AdminTagsPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const [items, setItems] = useState<TagItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
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

  const columns: TableColumnsType<TagItem> = useMemo(
    () => [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Slug', dataIndex: 'slug' },
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
              title="Delete tag?"
              onConfirm={async () => {
                await deleteTag(row.id)
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
            onClick={() => {
              setEditing(null)
              form.resetFields()
              setOpen(true)
            }}
          >
            Add tag
          </AppButton>
        }
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit tag' : 'Add tag'}
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
                await updateTag(editing.id, values)
                message.success('Updated')
              } else {
                await createTag(values)
                message.success('Created')
              }
              setOpen(false)
              void load()
            } catch {
              message.error('Save failed')
            }
          }}
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
