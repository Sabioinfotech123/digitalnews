import { App, Col, Form, Input, Row, Select, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createAdminBlog,
  fetchAdminBlogById,
  fetchCategories,
  fetchTags,
  updateAdminBlog,
} from '@/api/content'
import { AppButton } from '@/components/common/AppButton'
import { AppEditor } from '@/components/common/AppEditor'
import { AppLoader } from '@/components/common/AppLoader'
import { MediaUploader } from '@/components/common/MediaUploader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import type { BlogItem, BlogPayload, Category, TagItem } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'
import { stripHtml } from '@/utils/publicNews'
import { BRAND } from '@/config/brand'
import './AdminNewsFormPage.scss'

const { Title } = Typography

interface AdminBlogFormPageProps {
  mode: 'create' | 'edit'
}

export function AdminBlogFormPage({ mode }: AdminBlogFormPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<BlogPayload>()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [blog, setBlog] = useState<BlogItem | null>(null)

  useDocumentTitle(
    mode === 'create'
      ? `Create Blog | ${BRAND.name} CMS`
      : blog?.title
        ? `Edit: ${blog.title} | ${BRAND.name} CMS`
        : `Edit Blog | ${BRAND.name} CMS`,
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
          if (!cats.length) message.warning('Please create a category before adding blogs')
          if (!tagList.length) message.warning('Please create a tag before adding blogs')
        }

        if (mode === 'edit' && id) {
          const item = await fetchAdminBlogById(id)
          if (!active) return
          setBlog(item)
          form.setFieldsValue({
            ...item,
            tag_ids: item.tags.map((tag) => tag.id),
            short_description: stripHtml(item.short_description),
          })
        } else {
          form.setFieldsValue({
            language: 'en',
            status: 'draft',
            image_url: null,
            content: '',
            short_description: '',
          })
        }
      } catch {
        if (!active) return
        message.error(mode === 'edit' ? 'Blog not found' : 'Failed to load form data')
        if (mode === 'edit') navigate('/admin/blogs')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadFormData()
    return () => {
      active = false
    }
  }, [mode, id, form, message, navigate])

  const goBackToList = () => {
    navigate('/admin/blogs')
  }

  const handleTitleBlur = (value: string) => {
    if (!form.getFieldValue('slug')) {
      form.setFieldValue('slug', slugify(value))
    }
  }

  const handleValuesChange = (changed: Partial<BlogPayload>, all: BlogPayload) => {
    if (mode === 'create' && 'title' in changed && !form.isFieldTouched('slug')) {
      form.setFieldValue('slug', slugify(String(all.title || '')))
    }
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: BlogPayload) => {
    setSaving(true)
    try {
      const payload: BlogPayload = {
        ...values,
        category_id: values.category_id || null,
        tag_ids: values.tag_ids || [],
      }
      if (mode === 'create') {
        const created = await createAdminBlog(payload)
        message.success('Blog created successfully')
        navigate(`/admin/blogs/edit/${created.id}`)
      } else if (id) {
        const updated = await updateAdminBlog(id, payload)
        setBlog(updated)
        message.success('Blog updated successfully')
      }
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(
        getApiErrorMessage(err, mode === 'create' ? 'Could not create blog' : 'Save failed'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="news-form-page">
      <AppLoader fullscreen spinning={saving} tip={mode === 'create' ? 'Creating…' : 'Saving…'} />
      <div className="news-form-page__header">
        <Title level={3} className="news-form-page__title">
          {mode === 'create' ? 'Create blog' : 'Edit blog'}
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
              <Input.TextArea rows={4} placeholder="Write a short summary…" showCount maxLength={500} />
            </Form.Item>

            <Form.Item
              name="content"
              label="Content"
              rules={[{ required: true, message: 'Content is required' }]}
            >
              <AppEditor placeholder="Write the full blog…" minHeight={360} />
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <div className="news-form-page__side">
              <Form.Item name="image_url" label="Cover image">
                <MediaUploader kind="image" folder="blogs" label="" />
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

              <Form.Item name="seo_title" label="SEO title">
                <Input />
              </Form.Item>
              <Form.Item name="seo_description" label="SEO description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="seo_keywords" label="SEO keywords">
                <Input />
              </Form.Item>

              {blog ? (
                <p className="news-form-page__meta">
                  Author: {blog.author_name || '—'} · Views: {blog.view_count}
                </p>
              ) : null}

              <AppButton type="primary" htmlType="submit" loading={saving} block className="btn-soft-primary">
                {mode === 'create' ? 'Create blog' : 'Save changes'}
              </AppButton>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export function AdminBlogCreatePage() {
  return <AdminBlogFormPage mode="create" />
}

export function AdminBlogEditPage() {
  return <AdminBlogFormPage mode="edit" />
}
