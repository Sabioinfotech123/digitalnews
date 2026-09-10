import { Alert, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { BRAND } from '@/config/brand'
import './AdminLoginPage.scss'

const { Title, Paragraph, Text } = Typography

export function AdminLoginPage() {
  const { t } = useLanguage()
  const { login, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <span className="admin-login__logo">{BRAND.name}</span>
          <Text type="secondary">CMS</Text>
        </div>
        <Title level={3} className="admin-login__title">
          {t('admin.loginTitle')}
        </Title>
        <Paragraph type="secondary">{t('admin.loginSubtitle')}</Paragraph>

        {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={async (values: { email: string; password: string }) => {
            setError(null)
            setSubmitting(true)
            try {
              const user = await login(values.email, values.password)
              if (user.role !== 'ADMIN') {
                setError(t('auth.adminOnly'))
                return
              }
              navigate(from, { replace: true })
            } catch {
              setError(t('auth.invalidCredentials'))
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Form.Item
            label={t('auth.email')}
            name="email"
            rules={[{ required: true }]}
            initialValue="admin@example.com"
          >
            <Input size="large" prefix={<i className="fa-solid fa-envelope text-ink-muted" aria-hidden />} />
          </Form.Item>
          <Form.Item
            label={t('auth.password')}
            name="password"
            rules={[{ required: true, min: 8 }]}
            initialValue="Admin@12345"
          >
            <Input.Password size="large" prefix={<i className="fa-solid fa-lock text-ink-muted" aria-hidden />} />
          </Form.Item>
          <AppButton type="primary" htmlType="submit" size="large" block loading={submitting} className="btn-soft-primary">
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </AppButton>
        </Form>

        <div className="admin-login__footer">
          <Link to="/">{t('admin.backToSite')}</Link>
        </div>
      </div>
    </div>
  )
}
