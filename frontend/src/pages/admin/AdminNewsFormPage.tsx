import { App, Form, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createAdminNews,
  fetchAdminNewsById,
  fetchTags,
  updateAdminNews,
} from '@/api/content'
import { AppButton } from '@/components/common/AppButton'
import { AdminNewsFormFields } from '@/components/admin/AdminNewsFormFields'
import { AppLoader } from '@/components/common/AppLoader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import type { NewsItem, NewsPayload, NewsType, TagItem } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'
import { stripHtml } from '@/utils/publicNews'
import { BRAND } from '@/config/brand'
import { adminNewsEditPath } from '@/config/adminPages'
import { consumeAgentPrefill } from '@/utils/agentPrefill'
import './AdminNewsFormPage.scss'

const { Title } = Typography

const TYPE_TITLES: Record<NewsType, string> = {
  featured: 'Featured news',
  latest: 'Latest news',
  trending: 'Trending news',
  more: 'More news',
}

function isNewsType(value: string | undefined): value is NewsType {
  return value === 'featured' || value === 'latest' || value === 'trending' || value === 'more'
}

interface AdminNewsFormPageProps {
  mode: 'create' | 'edit'
  defaultNewsType?: NewsType
}

export function AdminNewsFormPage({ mode, defaultNewsType = 'latest' }: AdminNewsFormPageProps) {
  const { id, newsType: routeType } = useParams()
  const typeFromRoute = isNewsType(routeType) ? routeType : undefined
  const lockedType = typeFromRoute ?? defaultNewsType
  const typeLocked = Boolean(typeFromRoute)
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<NewsPayload>()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<TagItem[]>([])
  const [news, setNews] = useState<NewsItem | null>(null)

  const listPath =
    mode === 'edit' && news?.news_type
      ? `/admin/news/${news.news_type}`
      : typeFromRoute
        ? `/admin/news/${typeFromRoute}`
        : '/admin/news'

  useDocumentTitle(
    mode === 'create'
      ? typeFromRoute
        ? `Create ${TYPE_TITLES[typeFromRoute]} | ${BRAND.name} CMS`
        : `Create News | ${BRAND.name} CMS`
      : news?.title
        ? `Edit: ${news.title} | ${BRAND.name} CMS`
        : `Edit News | ${BRAND.name} CMS`,
  )

  useEffect(() => {
    let active = true

    async function loadFormData() {
      try {
        const tagList = await fetchTags()
        if (!active) return
        setTags(tagList)

        if (mode === 'create') {
          if (!tagList.length) {
            message.warning('Please create a tag before adding news')
          }
        }

        if (mode === 'edit' && id) {
          const item = await fetchAdminNewsById(id)
          if (!active) return
          setNews(item)
          form.setFieldsValue({
            ...item,
            tag_ids: item.tags.map((tag) => tag.id),
            short_description: stripHtml(item.short_description),
          })
        } else {
          const agentPrefill = consumeAgentPrefill()
          if (agentPrefill) {
            form.setFieldsValue({
              ...agentPrefill,
              news_type: agentPrefill.news_type || lockedType,
              is_featured: (agentPrefill.news_type || lockedType) === 'featured',
              is_breaking: false,
              tag_ids: [],
            })
            message.success('Agent draft loaded — review and upload image if needed')
          } else {
            form.setFieldsValue({
              language: 'en',
              status: 'draft',
              news_type: lockedType,
              is_featured: lockedType === 'featured',
              is_breaking: false,
              sort_order: 0,
              image_url: null,
              content: '',
              short_description: '',
            })
          }
        }
      } catch {
        if (!active) return
        message.error(mode === 'edit' ? 'News not found' : 'Failed to load form data')
        if (mode === 'edit') navigate('/admin/news')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadFormData()
    return () => {
      active = false
    }
  }, [mode, id, form, message, navigate, lockedType])

  const goBackToList = () => {
    navigate(listPath)
  }

  const handleTitleBlur = (value: string) => {
    if (!form.getFieldValue('slug')) {
      form.setFieldValue('slug', slugify(value))
    }
  }

  const handleValuesChange = (changed: Partial<NewsPayload>, all: NewsPayload) => {
    if (mode === 'create' && 'title' in changed && !form.isFieldTouched('slug')) {
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
        news_type: values.news_type || lockedType,
        is_featured: values.news_type === 'featured' || Boolean(values.is_featured),
        category_id: values.category_id,
        tag_ids: values.tag_ids || [],
      }
      if (mode === 'create') {
        // Backend assigns Order 1 and shifts the typed list; don't send form default 0.
        const createPayload = { ...payload }
        delete createPayload.sort_order
        const created = await createAdminNews(createPayload)
        message.success('News created successfully')
        const newsType = created.news_type || lockedType
        navigate(adminNewsEditPath(newsType, created.id))
      } else if (id) {
        const updated = await updateAdminNews(id, payload)
        setNews(updated)
        message.success('News updated successfully')
      }
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(
        getApiErrorMessage(err, mode === 'create' ? 'Could not create news' : 'Save failed'),
      )
    } finally {
      setSaving(false)
    }
  }

  const pageTitle =
    mode === 'create'
      ? typeFromRoute
        ? `Create ${TYPE_TITLES[typeFromRoute].toLowerCase()}`
        : 'Create news'
      : `Edit ${news ? TYPE_TITLES[news.news_type].toLowerCase() : 'news'}`

  return (
    <div className="news-form-page">
      <AppLoader fullscreen spinning={saving} tip={mode === 'create' ? 'Creating…' : 'Saving…'} />
      <div className="news-form-page__header">
        <Title level={3} className="news-form-page__title">
          {pageTitle}
        </Title>
        <AppButton onClick={goBackToList}>Back to list</AppButton>
      </div>

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
          mode={mode}
          typeLocked={typeLocked}
          tags={tags}
          loading={loading}
          saving={saving}
          news={news}
          onTitleBlur={handleTitleBlur}
          onCategoriesMissing={() => message.warning('Please create a category before adding news')}
        />
      </Form>
    </div>
  )
}

export function AdminNewsCreatePage() {
  return <AdminNewsFormPage mode="create" />
}

export function AdminNewsEditPage() {
  return <AdminNewsFormPage mode="edit" />
}
