import { App, Form, Input, Modal, Popconfirm, Space, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTag, deleteTag, fetchTags, updateTag } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppTable } from '@/components/common/AppTable'
import type { TagItem } from '@/types/content'
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
                onClick={() => {
                  setEditing(row)
                  form.setFieldsValue(row)
                  setOpen(true)
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete tag?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                await deleteTag(row.id)
                message.success('Deleted')
                void load()
              }}
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
