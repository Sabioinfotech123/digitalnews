import { Alert, App, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { BRAND } from '@/config/brand'
import { getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import './PublicAuthPage.scss'

const { Title, Paragraph } = Typography

type LoginValues = { email: string; password: string }

export function LoginPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { login, isAuthenticated, loading } = useAuth()
  const { logoUrl } = useSiteSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: LoginValues) => {
    setError(null)
    setSubmitting(true)
    try {
      const user = await login(values.email, values.password)
      message.success('Signed in successfully')
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, t('auth.invalidCredentials'))
      setError(msg)
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="public-auth">
      <AppLoader fullscreen spinning={submitting} tip={t('auth.signingIn')} />
      <div className="public-auth__card">
        <div className="public-auth__brand">
          <img src={logoUrl} alt={BRAND.name} className="public-auth__logo" />
        </div>
        <Title level={3} className="public-auth__title">
          {t('auth.login')}
        </Title>
        <Paragraph type="secondary">{t('auth.loginSubtitle')}</Paragraph>

        {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}

        <Form
          layout="vertical"
          requiredMark={false}
          disabled={submitting}
          onFinishFailed={handleFinishFailed}
          onFinish={handleFinish}
        >
          <Form.Item label={t('auth.email')} name="email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" prefix={<i className="fa-solid fa-envelope text-ink-muted" aria-hidden />} />
          </Form.Item>
          <Form.Item
            label={t('auth.password')}
            name="password"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password size="large" prefix={<i className="fa-solid fa-lock text-ink-muted" aria-hidden />} />
          </Form.Item>
          <AppButton
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            className="btn-soft-primary"
          >
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </AppButton>
        </Form>

        <div className="public-auth__footer">
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </div>
      </div>
    </div>
  )
}
