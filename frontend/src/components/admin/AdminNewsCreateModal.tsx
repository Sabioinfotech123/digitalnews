import { App, Form, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { createAdminNews, fetchTags } from '@/api/content'
import { AdminNewsFormFields } from '@/components/admin/AdminNewsFormFields'
import { AppLoader } from '@/components/common/AppLoader'
import type { AgentDraftFields } from '@/types/agent'
import type { NewsPayload, NewsType, TagItem } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'
import { stripHtml } from '@/utils/publicNews'
import '@/pages/admin/AdminNewsFormPage.scss'
import './AdminNewsCreateModal.scss'

function draftToFormValues(draft: AgentDraftFields): Partial<NewsPayload> {
  return {
    title: draft.title,
    slug: draft.slug,
    short_description: stripHtml(draft.short_description),
    content: draft.content,
    news_type: draft.news_type,
    language: draft.language,
    status: 'draft',
    image_url: draft.image_url,
    seo_title: draft.seo_title ?? undefined,
    seo_description: draft.seo_description ?? undefined,
    is_featured: draft.news_type === 'featured',
    is_breaking: false,
    tag_ids: [],
  }
}

export interface AdminNewsCreateModalProps {
  open: boolean
  draft: AgentDraftFields | null
  showTitle?: boolean
  onClose: () => void
  onCreated?: (newsType: NewsType) => void
}

export function AdminNewsCreateModal({
  open,
  draft,
  showTitle = true,
  onClose,
  onCreated,
}: AdminNewsCreateModalProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<NewsPayload>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<TagItem[]>([])

  useEffect(() => {
    if (!open) return
    let active = true

    ;(async () => {
      setLoading(true)
      try {
        const tagList = await fetchTags()
        if (!active) return
        setTags(tagList)
        if (!tagList.length) {
          message.warning('Please create a tag before adding news')
        }
        if (draft) {
          form.setFieldsValue(draftToFormValues(draft))
        } else {
          form.setFieldsValue({
            language: 'en',
            status: 'draft',
            news_type: 'latest',
            is_featured: false,
            is_breaking: false,
            image_url: null,
            content: '',
            short_description: '',
            tag_ids: [],
          })
        }
      } catch {
        if (active) message.error('Failed to load form')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [open, draft, form, message])

  const handleTitleBlur = (value: string) => {
    if (!form.getFieldValue('slug')) {
      form.setFieldValue('slug', slugify(value))
    }
  }

  const handleValuesChange = (changed: Partial<NewsPayload>, all: NewsPayload) => {
    if ('title' in changed && !form.isFieldTouched('slug')) {
      form.setFieldValue('slug', slugify(String(all.title || '')))
    }
    if ('news_type' in changed) {
      form.setFieldValue('is_featured', all.news_type === 'featured')
    }
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: NewsPayload) => {
    setSaving(true)
    try {
      const payload: NewsPayload = {
        ...values,
        is_featured: values.news_type === 'featured' || Boolean(values.is_featured),
        category_id: values.category_id,
        tag_ids: values.tag_ids || [],
      }
      const createPayload = { ...payload }
      delete createPayload.sort_order
      const created = await createAdminNews(createPayload)
      message.success('News created successfully')
      onCreated?.(created.news_type)
      form.resetFields()
      onClose()
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(getApiErrorMessage(err, 'Could not create news'))
    } finally {
      setSaving(false)
    }
  }

  const modalTitle = showTitle ? 'Add news from agent' : 'Add news'

  return (
    <Modal
      title={modalTitle}
      open={open}
      centered
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Add news"
      cancelText="Cancel"
      confirmLoading={saving}
      maskClosable={!saving && !loading}
      width={1180}
      destroyOnClose
      className="admin-news-create-modal"
    >
      <AppLoader spinning={saving} tip="Creating…" fullscreen={false} />
      <Form
        form={form}
        layout="vertical"
        disabled={loading || saving}
        className="news-form-page__form"
        onValuesChange={handleValuesChange}
        onFinishFailed={handleFinishFailed}
        onFinish={handleFinish}
      >
        <AdminNewsFormFields
          form={form}
          mode="create"
          typeLocked={false}
          tags={tags}
          loading={loading}
          saving={saving}
          onTitleBlur={handleTitleBlur}
          contentMinHeight={280}
          submitLabel="Add news"
          showSubmitButton={false}
          onCategoriesMissing={() => message.warning('Please create a category before adding news')}
        />
      </Form>
    </Modal>
  )
}