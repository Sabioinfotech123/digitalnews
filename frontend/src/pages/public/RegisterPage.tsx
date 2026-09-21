import { Alert, App, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import logoImg from '@/assets/logo/logo.png'
import { BRAND } from '@/config/brand'
import { getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import './PublicAuthPage.scss'

const { Title, Paragraph } = Typography

type RegisterValues = { full_name: string; email: string; password: string; confirm: string }

export function RegisterPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { register, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: RegisterValues) => {
    setError(null)
    setSubmitting(true)
    try {
      await register(values.email, values.password, values.full_name)
      message.success('Account created successfully')
      navigate('/', { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, t('auth.registerFailed'))
      setError(msg)
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="public-auth">
      <AppLoader fullscreen spinning={submitting} tip={t('auth.signingUp')} />
      <div className="public-auth__card">
        <div className="public-auth__brand">
          <img src={logoImg} alt={BRAND.name} className="public-auth__logo" />
        </div>
        <Title level={3} className="public-auth__title">
          {t('auth.register')}
        </Title>
        <Paragraph type="secondary">{t('auth.registerSubtitle')}</Paragraph>

        {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}

        <Form
          layout="vertical"
          requiredMark={false}
          disabled={submitting}
          onFinishFailed={handleFinishFailed}
          onFinish={handleFinish}
        >
          <Form.Item
            label={t('auth.fullName')}
            name="full_name"
            rules={[{ required: true, min: 2 }]}
          >
            <Input size="large" prefix={<i className="fa-solid fa-user text-ink-muted" aria-hidden />} />
          </Form.Item>
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
          <Form.Item
            label={t('auth.confirmPassword')}
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('auth.passwordMismatch')))
                },
              }),
            ]}
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
            {submitting ? t('auth.signingUp') : t('auth.signUp')}
          </AppButton>
        </Form>

        <div className="public-auth__footer">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
        </div>
      </div>
    </div>
  )
}
