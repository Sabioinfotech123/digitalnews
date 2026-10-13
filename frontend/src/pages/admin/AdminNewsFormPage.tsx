import { App, Form, Input, InputNumber, Select, Switch, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createAdminNews,
  fetchAdminNewsById,
  fetchCategories,
  fetchTags,
  updateAdminNews,
} from '@/api/content'
import { AppButton } from '@/components/common/AppButton'
import { AppEditor } from '@/components/common/AppEditor'
import { AppLoader } from '@/components/common/AppLoader'
import { MediaUploader } from '@/components/common/MediaUploader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import type { Category, NewsItem, NewsPayload, NewsType, TagItem } from '@/types/content'
import { NEWS_TYPES } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'
import { stripHtml } from '@/utils/publicNews'
import { BRAND } from '@/config/brand'
import { adminNewsEditPath } from '@/config/adminPages'
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
  const [categories, setCategories] = useState<Category[]>([])
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
        const [cats, tagList] = await Promise.all([fetchCategories(), fetchTags()])
        if (!active) return
        setCategories(cats)
        setTags(tagList)

        if (mode === 'create') {
          if (!cats.length) {
            message.warning('Please create a category before adding news')
          }
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
        category_id: values.category_id || null,
        tag_ids: values.tag_ids || [],
      }
      if (mode === 'create') {
        const created = await createAdminNews(payload)
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
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col lg:col-span-8">
            <Form.Item name="title" label="Title" rules={[{ required: true, min: 3 }]} className="w-full">
              <Input
                size="large"
                className="w-full"
                onBlur={(e) => handleTitleBlur(e.target.value)}
              />
            </Form.Item>

            <Form.Item name="slug" label="Slug" rules={[{ required: true, min: 3 }]} className="w-full">
              <Input className="w-full" />
            </Form.Item>

            <Form.Item
              name="short_description"
              label="Short description"
              rules={[{ required: true, message: 'Description is required' }]}
              className="w-full"
            >
              <Input.TextArea
                className="w-full"
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
              className="w-full"
            >
              <AppEditor placeholder="Write the full article…" minHeight={360} />
            </Form.Item>
          </div>

          <div className="news-form-page__side lg:col-span-4 lg:sticky lg:top-4">
            <Form.Item
              name="image_url"
              label="News image"
              rules={[{ required: true, message: 'News image is required' }]}
              className="w-full"
            >
              <MediaUploader kind="image" folder="news" label="" required />
            </Form.Item>

            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item name="news_type" label="News type" rules={[{ required: true }]} className="w-full">
                <Select
                  className="w-full"
                  options={NEWS_TYPES}
                  disabled={mode === 'create' && typeLocked}
                />
              </Form.Item>

              <Form.Item name="language" label="Content language" rules={[{ required: true }]} className="w-full">
                <Select
                  className="w-full"
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'te', label: 'తెలుగు' },
                  ]}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item name="status" label="Status" className="w-full">
                <Select
                  className="w-full"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'unpublished', label: 'Unpublished' },
                    { value: 'scheduled', label: 'Scheduled' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="sort_order"
                label="Display order"
                tooltip="Lower number shows first on the public site (0, 1, 2…)"
                className="w-full"
              >
                <InputNumber min={0} step={1} className="!w-full" />
              </Form.Item>
            </div>

            <Form.Item name="category_id" label="Category" className="w-full">
              <Select
                className="w-full"
                allowClear
                showSearch
                optionFilterProp="label"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
              />
            </Form.Item>

            <Form.Item name="tag_ids" label="Tags" className="w-full">
              <Select
                className="w-full"
                mode="multiple"
                allowClear
                showSearch
                optionFilterProp="label"
                options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                placeholder="Select tags"
              />
            </Form.Item>

            <Form.Item name="is_breaking" label="Breaking" valuePropName="checked" className="mb-4 w-full">
              <Switch />
            </Form.Item>

            <Form.Item name="seo_title" label="SEO title" className="w-full">
              <Input className="w-full" />
            </Form.Item>
            <Form.Item name="seo_description" label="SEO description" className="w-full">
              <Input.TextArea className="w-full" rows={3} />
            </Form.Item>
            <Form.Item name="seo_keywords" label="SEO keywords" className="w-full">
              <Input className="w-full" />
            </Form.Item>

            {news ? (
              <p className="news-form-page__meta">
                Author: {news.author_name || '—'} · Views: {news.view_count}
              </p>
            ) : null}

            <AppButton type="primary" htmlType="submit" loading={saving} block className="btn-soft-primary w-full">
              {mode === 'create' ? 'Create news' : 'Save changes'}
            </AppButton>
          </div>
        </div>
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
