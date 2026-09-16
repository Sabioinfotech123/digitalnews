import { App, Form, Input, Modal, Select, Space, Switch, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUserPayload,
} from '@/api/auth'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { AppTable } from '@/components/common/AppTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { AuthUser, UserRole } from '@/types/auth'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { confirmDelete } from '@/utils/confirmDelete'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' })
}

type UserFormValues = {
  full_name: string
  email: string
  password?: string
  role: UserRole
  is_active: boolean
}

export function AdminUsersPage() {
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const { message, modal } = App.useApp()
  const [items, setItems] = useState<AuthUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<AuthUser | null>(null)
  const [form] = Form.useForm<UserFormValues>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchAdminUsers(search || undefined))
    } catch {
      message.error('Failed to load users')
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
    form.setFieldsValue({ role: 'USER', is_active: true })
    setOpen(true)
  }

  const openEditModal = (row: AuthUser) => {
    setEditing(row)
    form.setFieldsValue({
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      is_active: row.is_active,
      password: undefined,
    })
    setOpen(true)
  }

  const closeModal = () => {
    if (!saving) setOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminUser(id)
      message.success('User deleted successfully')
      void load()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Delete failed'))
    }
  }

  const askDelete = (row: AuthUser) => {
    confirmDelete({
      modal,
      title: 'Delete user?',
      content: `Delete “${row.full_name}”? This cannot be undone.`,
      onConfirm: () => handleDelete(row.id),
    })
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: UserFormValues) => {
    setSaving(true)
    try {
      const payload: AdminUserPayload = {
        full_name: values.full_name,
        email: values.email,
        role: values.role,
        is_active: values.is_active,
      }
      if (values.password) {
        payload.password = values.password
      }
      if (editing) {
        await updateAdminUser(editing.id, payload)
        message.success('User updated successfully')
      } else {
        if (!values.password) {
          message.error('Password is required')
          return
        }
        await createAdminUser({ ...payload, password: values.password })
        message.success('User created successfully')
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

  const columns: TableColumnsType<AuthUser> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'full_name',
        sorter: (a, b) => compareText(a.full_name, b.full_name),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        sorter: (a, b) => compareText(a.email, b.email),
      },
      {
        title: 'Role',
        dataIndex: 'role',
        width: 110,
        sorter: (a, b) => compareText(a.role, b.role),
        render: (role: string) => <StatusBadge status={role} />,
      },
      {
        title: 'Status',
        dataIndex: 'is_active',
        width: 110,
        sorter: (a, b) => Number(b.is_active) - Number(a.is_active),
        render: (active: boolean) => <StatusBadge status={active ? 'active' : 'inactive'} />,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        align: 'center',
        render: (_, row) => {
          const isSelf = currentUser?.id === row.id
          return (
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
              <Tooltip title={isSelf ? 'Cannot delete yourself' : 'Delete'}>
                <AppButton
                  type="text"
                  aria-label="Delete"
                  className="app-table__icon-btn app-table__icon-btn--delete"
                  icon={<i className="fa-solid fa-trash-can" aria-hidden />}
                  disabled={isSelf}
                  onClick={() => askDelete(row)}
                />
              </Tooltip>
            </Space>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.id, load, message, modal],
  )

  return (
    <>
      <AppLoader fullscreen spinning={saving} tip="Saving…" />
      <AppTable<AuthUser>
        title={t('admin.users')}
        loading={loading}
        dataSource={items}
        columns={columns}
        onRefresh={() => void load()}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or email…"
        toolbar={
          <AppButton
            type="primary"
            icon={<i className="fa-solid fa-plus" aria-hidden />}
            onClick={openCreateModal}
          >
            Add user
          </AppButton>
        }
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit user' : 'Add user'}
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
          <Form.Item name="full_name" label="Full name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing ? 'Password (optional)' : 'Password'}
            rules={editing ? [{ min: 8 }] : [{ required: true, min: 8 }]}
          >
            <Input.Password placeholder={editing ? 'Leave blank to keep current' : undefined} />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'USER', label: 'User' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
            />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
