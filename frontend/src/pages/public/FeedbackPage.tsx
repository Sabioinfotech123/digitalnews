import { App, Form, Input, Rate, Result, Select } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { submitFeedback } from '@/api/feedback'
import { useAuth } from '@/app/providers/AuthProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import type { FeedbackCategory } from '@/types/feedback'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import './FeedbackPage.scss'

type FeedbackValues = {
  name?: string
  email?: string
  category: FeedbackCategory
  rating: number
  message: string
  website?: string
}

export function FeedbackPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [form] = Form.useForm<FeedbackValues>()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const fromPath = (location.state as { from?: string } | null)?.from ?? null

  useEffect(() => {
    document.title = t('feedback.title')
  }, [t])

  const categoryOptions: { value: FeedbackCategory; label: string }[] = [
    { value: 'general', label: t('feedback.categoryGeneral') },
    { value: 'suggestion', label: t('feedback.categorySuggestion') },
    { value: 'bug', label: t('feedback.categoryBug') },
    { value: 'content', label: t('feedback.categoryContent') },
    { value: 'other', label: t('feedback.categoryOther') },
  ]

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: FeedbackValues) => {
    setSubmitting(true)
    try {
      await submitFeedback({
        name: isAuthenticated ? undefined : values.name?.trim(),
        email: isAuthenticated ? undefined : values.email?.trim(),
        category: values.category,
        rating: values.rating,
        message: values.message.trim(),
        page_url: fromPath,
        website: values.website || undefined,
      })
      setSent(true)
      form.resetFields()
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(getApiErrorMessage(err, 'Could not send feedback'))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <main className="feedback-page">
        <div className="feedback-page__card">
          <Result
            status="success"
            title={t('feedback.successTitle')}
            subTitle={t('feedback.successText')}
            extra={[
              <AppButton key="again" type="primary" className="btn-soft-primary" onClick={() => setSent(false)}>
                {t('feedback.sendAnother')}
              </AppButton>,
              <AppButton key="home" type="default" href="/">
                {t('feedback.backHome')}
              </AppButton>,
            ]}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="feedback-page">
      <div className="feedback-page__card">
        <header className="feedback-page__head">
          <span className="feedback-page__icon" aria-hidden>
            <i className="fa-solid fa-comment-dots" />
          </span>
          <div>
            <h1 className="feedback-page__title">{t('feedback.title')}</h1>
            <p className="feedback-page__subtitle">{t('feedback.subtitle')}</p>
          </div>
        </header>

        {isAuthenticated && user ? (
          <div className="feedback-page__identity">
            <i className="fa-solid fa-circle-user" aria-hidden />
            <span>
              {t('feedback.sendingAs')} <strong>{user.full_name}</strong>. {t('feedback.signedInNote')}
            </span>
          </div>
        ) : (
          <div className="feedback-page__identity feedback-page__identity--guest">
            <i className="fa-solid fa-user-secret" aria-hidden />
            <span>
              {t('feedback.guestHint')}{' '}
              <Link to="/login" state={{ from: '/feedback' }}>
                {t('feedback.loginHint')}
              </Link>{' '}
              {t('feedback.loginHintSuffix')}
            </span>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={submitting}
          initialValues={{ category: 'general' }}
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
        >
          {!isAuthenticated ? (
            <div className="feedback-page__row">
              <Form.Item
                label={t('feedback.name')}
                name="name"
                rules={[{ required: true, whitespace: true, min: 2, max: 120 }]}
              >
                <Input size="large" prefix={<i className="fa-solid fa-user text-ink-muted" aria-hidden />} />
              </Form.Item>
              <Form.Item
                label={t('feedback.email')}
                name="email"
                rules={[{ required: true, type: 'email', max: 255 }]}
              >
                <Input size="large" prefix={<i className="fa-solid fa-envelope text-ink-muted" aria-hidden />} />
              </Form.Item>
            </div>
          ) : null}

          <div className="feedback-page__row">
            <Form.Item label={t('feedback.category')} name="category" rules={[{ required: true }]}>
              <Select size="large" options={categoryOptions} />
            </Form.Item>
            <Form.Item
              label={t('feedback.rating')}
              name="rating"
              rules={[{ required: true, type: 'number', min: 1, message: t('feedback.ratingRequired') }]}
            >
              <Rate className="feedback-page__rate" />
            </Form.Item>
          </div>

          <Form.Item
            label={t('feedback.message')}
            name="message"
            rules={[{ required: true, whitespace: true, min: 10, max: 2000 }]}
          >
            <Input.TextArea
              rows={6}
              showCount
              maxLength={2000}
              placeholder={t('feedback.messagePlaceholder')}
            />
          </Form.Item>

          <Form.Item name="website" className="feedback-page__hp" aria-hidden>
            <Input tabIndex={-1} autoComplete="off" />
          </Form.Item>

          <AppButton
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            className="btn-soft-primary"
            icon={<i className="fa-solid fa-paper-plane" aria-hidden />}
          >
            {submitting ? t('feedback.sending') : t('feedback.submit')}
          </AppButton>
        </Form>
      </div>
    </main>
  )
}
