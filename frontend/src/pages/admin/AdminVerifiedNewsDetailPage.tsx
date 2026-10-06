import { App, Col, Form, Input, Row, Select, Space, Switch, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCategories, fetchTags } from '@/api/content'
import { fetchVerifiedNewsById, importVerifiedNews } from '@/api/localNews'
import { AppButton } from '@/components/common/AppButton'
import { AppEditor } from '@/components/common/AppEditor'
import { AppLoader } from '@/components/common/AppLoader'
import { MediaUploader } from '@/components/common/MediaUploader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { adminNewsEditPath } from '@/config/adminPages'
import type { Category, NewsType, TagItem } from '@/types/content'
import { NEWS_TYPES } from '@/types/content'
import type { VerifiedLocalNewsItem } from '@/types/localNews'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'
import './AdminNewsFormPage.scss'

const { Title } = Typography

type VerifiedImportForm = {
  title: string
  slug: string
  short_description: string
  content: string
  image_url: string | null
  news_type: NewsType
  language: 'en' | 'te'
  status: 'draft' | 'published' | 'unpublished' | 'scheduled'
  category_id?: string | null
  tag_ids?: string[]
  is_breaking?: boolean
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildDefaultContent(item: VerifiedLocalNewsItem, description: string): string {
  const source = item.source_name || 'source'
  const body = description || item.title
  const summary = item.ai_summary
    ? `<p><strong>AI note:</strong> ${item.ai_summary}</p>`
    : ''
  return [
    `<p>${body}</p>`,
    summary,
    `<p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Read original article</a></p>`,
    `<p><em>Imported from verified local news · ${source}</em></p>`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function AdminVerifiedNewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [form] = Form.useForm<VerifiedImportForm>()

  const [item, setItem] = useState<VerifiedLocalNewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])

  useEffect(() => {
    if (!id) return
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [data, cats, tagList] = await Promise.all([
          fetchVerifiedNewsById(id),
          fetchCategories(),
          fetchTags(),
        ])
        if (!active) return
        setItem(data)
        setCategories(cats)
        setTags(tagList)
        const description = data.description || data.title
        form.setFieldsValue({
          title: data.title,
          slug: slugify(data.title),
          short_description: description.slice(0, 500),
          content: buildDefaultContent(data, description),
          image_url: data.image_url,
          news_type: 'latest',
          language: 'en',
          status: 'published',
          is_breaking: false,
          category_id: null,
          tag_ids: [],
          seo_title: data.title,
          seo_description: description.slice(0, 500),
        })
      } catch (err) {
        if (!active) return
        message.error(getApiErrorMessage(err, 'Could not load verified item'))
        setItem(null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id, form, message])

  const goBackToList = () => {
    navigate('/admin/verified-news')
  }

  const handleTitleBlur = (value: string) => {
    if (!form.getFieldValue('slug')) {
      form.setFieldValue('slug', slugify(value))
    }
  }

  const handleValuesChange = (changed: Partial<VerifiedImportForm>, all: VerifiedImportForm) => {
    if ('title' in changed && !form.isFieldTouched('slug')) {
      form.setFieldValue('slug', slugify(String(all.title || '')))
    }
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: VerifiedImportForm) => {
    if (!id) return
    setSaving(true)
    try {
      const result = await importVerifiedNews(id, {
        news_type: values.news_type,
        language: values.language,
        status: values.status === 'published' || values.status === 'draft' ? values.status : 'draft',
        category_id: values.category_id || null,
        tag_ids: values.tag_ids || [],
        is_breaking: Boolean(values.is_breaking),
        title: values.title,
        slug: values.slug,
        short_description: values.short_description,
        content: values.content,
        image_url: values.image_url,
        seo_title: values.seo_title,
        seo_description: values.seo_description,
        seo_keywords: values.seo_keywords,
      })
      message.success(`Added to ${values.news_type} news`)
      navigate(adminNewsEditPath(values.news_type, result.news_id))
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(getApiErrorMessage(err, 'Could not add to CMS news'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AppLoader tip="Loading verified item…" />
  }

  if (!item) {
    return (
      <div className="news-form-page">
        <div className="news-form-page__header">
          <Title level={3} className="news-form-page__title">
            Add verified news
          </Title>
          <AppButton onClick={goBackToList}>Back to list</AppButton>
        </div>
        <p className="news-form-page__meta">Verified item not found. Open it again from the list.</p>
      </div>
    )
  }

  return (
    <div className="news-form-page">
      <AppLoader fullscreen spinning={saving} tip="Adding…" />
      <div className="news-form-page__header">
        <div>
          <Title level={3} className="news-form-page__title">
            Add verified news
          </Title>
          <p className="news-form-page__meta" style={{ marginTop: '0.35rem', marginBottom: 0 }}>
            {item.source_name || 'Unknown source'} · {formatDate(item.published_at)}
            {item.country ? ` · ${item.country}` : ''} · Local flag will be set
          </p>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <StatusBadge status={item.verdict} />
            <span className="text-xs text-ink-muted">
              {item.confidence}% · {item.ai_provider}
            </span>
          </div>
        </div>
        <Space>
          <AppButton
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            icon={<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />}
          >
            Original
          </AppButton>
          <AppButton onClick={goBackToList}>Back to list</AppButton>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        disabled={saving}
        className="news-form-page__form"
        onValuesChange={handleValuesChange}
        onFinishFailed={handleFinishFailed}
        onFinish={handleFinish}
      >
        <Row gutter={[20, 0]}>
          <Col xs={24} lg={16}>
            <Form.Item name="title" label="Title" rules={[{ required: true, min: 3 }]}>
              <Input size="large" onBlur={(e) => handleTitleBlur(e.target.value)} />
            </Form.Item>

            <Form.Item name="slug" label="Slug" rules={[{ required: true, min: 3 }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="short_description"
              label="Short description"
              rules={[{ required: true, message: 'Description is required' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Write a short summary…"
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Content is required' }]}
            >
              <AppEditor placeholder="Write the full article…" minHeight={360} />
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <div className="news-form-page__side">
              <Form.Item
                name="image_url"
                label="News image"
                rules={[{ required: true, message: 'News image is required' }]}
              >
                <MediaUploader kind="image" folder="news" label="" required />
              </Form.Item>

              <Form.Item name="news_type" label="News type" rules={[{ required: true }]}>
                <Select options={NEWS_TYPES} />
              </Form.Item>

              <Form.Item name="language" label="Content language" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'te', label: 'తెలుగు' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="status" label="Status">
                <Select
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'unpublished', label: 'Unpublished' },
                    { value: 'scheduled', label: 'Scheduled' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="category_id" label="Category">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select category"
                />
              </Form.Item>

              <Form.Item name="tag_ids" label="Tags">
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                  placeholder="Select tags"
                />
              </Form.Item>

              <Space size="large" className="mb-4">
                <Form.Item name="is_breaking" label="Breaking" valuePropName="checked" className="!mb-0">
                  <Switch />
                </Form.Item>
              </Space>

              <Form.Item name="seo_title" label="SEO title">
                <Input />
              </Form.Item>
              <Form.Item name="seo_description" label="SEO description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="seo_keywords" label="SEO keywords">
                <Input />
              </Form.Item>

              <AppButton type="primary" htmlType="submit" loading={saving} block className="btn-soft-primary">
                Add to CMS news
              </AppButton>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
