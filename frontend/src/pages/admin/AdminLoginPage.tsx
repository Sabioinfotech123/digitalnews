import { Alert, App, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import logoImg from '@/assets/logo/logo.png'
import { getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import './AdminLoginPage.scss'

const { Title, Paragraph } = Typography

type LoginValues = { email: string; password: string }

export function AdminLoginPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { login, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: LoginValues) => {
    setError(null)
    setSubmitting(true)
    try {
      const user = await login(values.email, values.password)
      if (user.role !== 'ADMIN') {
        const msg = t('auth.adminOnly')
        setError(msg)
        message.error(msg)
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, t('auth.invalidCredentials'))
      setError(msg)
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="admin-login">
      <AppLoader fullscreen spinning={submitting} tip={t('auth.signingIn')} />
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <img src={logoImg} alt="AK News" className="admin-login__logo" />
        </div>
        <Title level={3} className="admin-login__title">
          {t('admin.loginTitle')}
        </Title>
        <Paragraph type="secondary">{t('admin.loginSubtitle')}</Paragraph>

        {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}

        <Form
          layout="vertical"
          requiredMark={false}
          disabled={submitting}
          onFinishFailed={handleFinishFailed}
          onFinish={handleFinish}
        >
          <Form.Item
            label={t('auth.email')}
            name="email"
            rules={[{ required: true }]}
            initialValue="hr@sabioinfotech.com"
          >
            <Input size="large" prefix={<i className="fa-solid fa-envelope text-ink-muted" aria-hidden />} />
          </Form.Item>
          <Form.Item
            label={t('auth.password')}
            name="password"
            rules={[{ required: true, min: 8 }]}
            initialValue="Sabio@123"
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
