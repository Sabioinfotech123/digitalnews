import { App, Form, Input, InputNumber, Select, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createAdminVideo,
  fetchAdminVideoById,
  fetchCategories,
  fetchTags,
  updateAdminVideo,
} from '@/api/content'
import { AppButton } from '@/components/common/AppButton'
import { AppEditor } from '@/components/common/AppEditor'
import { AppLoader } from '@/components/common/AppLoader'
import { MediaUploader } from '@/components/common/MediaUploader'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import type { Category, TagItem, VideoItem, VideoPayload } from '@/types/content'
import { applyApiFieldErrors, getApiErrorMessage } from '@/utils/apiError'
import { getFormValidationMessage, type FormValidationInfo } from '@/utils/formFeedback'
import { slugify } from '@/utils/slugify'
import { stripHtml } from '@/utils/publicNews'
import { BRAND } from '@/config/brand'
import './AdminNewsFormPage.scss'

const { Title } = Typography

interface AdminVideoFormPageProps {
  mode: 'create' | 'edit'
}

function hasVideoSource(values: Partial<VideoPayload>) {
  return Boolean(values.video_url?.trim() || values.youtube_url?.trim())
}

function hasUploadedVideo(values: Partial<VideoPayload>) {
  return Boolean(values.video_url?.trim())
}

export function AdminVideoFormPage({ mode }: AdminVideoFormPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<VideoPayload>()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [video, setVideo] = useState<VideoItem | null>(null)
  const watchedVideoUrl = Form.useWatch('video_url', form)
  const thumbnailRequired = Boolean(String(watchedVideoUrl || '').trim())

  useDocumentTitle(
    mode === 'create'
      ? `Create Video | ${BRAND.name} CMS`
      : video?.title
        ? `Edit: ${video.title} | ${BRAND.name} CMS`
        : `Edit Video | ${BRAND.name} CMS`,
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
          if (!cats.length) message.warning('Please create a category before adding videos')
          if (!tagList.length) message.warning('Please create a tag before adding videos')
        }

        if (mode === 'edit' && id) {
          const item = await fetchAdminVideoById(id)
          if (!active) return
          setVideo(item)
          form.setFieldsValue({
            ...item,
            tag_ids: item.tags.map((tag) => tag.id),
            description: stripHtml(item.description),
            content: item.content || '',
          })
        } else {
          form.setFieldsValue({
            language: 'en',
            status: 'draft',
            sort_order: 0,
            video_url: null,
            youtube_url: null,
            thumbnail_url: null,
            description: '',
            content: '',
            tag_ids: [],
          })
        }
      } catch {
        if (!active) return
        message.error(mode === 'edit' ? 'Video not found' : 'Failed to load form')
        if (mode === 'edit') navigate('/admin/videos')
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
    navigate('/admin/videos')
  }

  const handleTitleBlur = (value: string) => {
    if (!form.getFieldValue('slug')) {
      form.setFieldValue('slug', slugify(value))
    }
  }

  const handleValuesChange = (changed: Partial<VideoPayload>, all: VideoPayload) => {
    if (mode === 'create' && 'title' in changed && !form.isFieldTouched('slug')) {
      form.setFieldValue('slug', slugify(String(all.title || '')))
    }
    if ('video_url' in changed) {
      void form.validateFields(['thumbnail_url']).catch(() => undefined)
    }
  }

  const handleFinishFailed = (info: FormValidationInfo) => {
    message.error(getFormValidationMessage(info))
  }

  const handleFinish = async (values: VideoPayload) => {
    if (!hasVideoSource(values)) {
      message.error('Upload a video file or add a YouTube URL (or both)')
      return
    }
    if (hasUploadedVideo(values) && !values.thumbnail_url?.trim()) {
      message.error('Thumbnail is required when uploading a video file')
      return
    }

    setSaving(true)
    try {
      const payload: VideoPayload = {
        ...values,
        category_id: values.category_id || null,
        tag_ids: values.tag_ids || [],
        video_url: values.video_url?.trim() || null,
        youtube_url: values.youtube_url?.trim() || null,
        thumbnail_url: values.thumbnail_url?.trim() || null,
        description: values.description?.trim() || null,
        content: values.content || '',
        sort_order: values.sort_order ?? 0,
      }
      if (mode === 'create') {
        const created = await createAdminVideo(payload)
        message.success('Video created successfully')
        navigate(`/admin/videos/edit/${created.id}`)
      } else if (id) {
        const updated = await updateAdminVideo(id, payload)
        setVideo(updated)
        message.success('Video updated successfully')
      }
    } catch (err) {
      applyApiFieldErrors(form, err)
      message.error(
        getApiErrorMessage(err, mode === 'create' ? 'Could not create video' : 'Save failed'),
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
          {mode === 'create' ? 'Create video' : 'Edit video'}
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
              name="description"
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
              <AppEditor placeholder="Write the full video details…" minHeight={360} />
            </Form.Item>
          </div>

          <div className="news-form-page__side lg:col-span-4 lg:sticky lg:top-4">
            <Form.Item
              name="video_url"
              label="Video file"
              extra="Upload MP4/WEBM, and/or add a YouTube URL below."
              className="w-full"
            >
              <MediaUploader kind="video" folder="videos" label="" />
            </Form.Item>

            <Form.Item
              name="youtube_url"
              label="YouTube URL"
              extra="Paste a full YouTube link. You can use this alone, or together with an uploaded file."
              className="w-full"
            >
              <Input className="w-full" placeholder="https://www.youtube.com/watch?v=…" allowClear />
            </Form.Item>

            <Form.Item
              name="thumbnail_url"
              label="Thumbnail"
              className="w-full"
              required={thumbnailRequired}
              extra={
                thumbnailRequired
                  ? 'Required when a video file is uploaded.'
                  : 'Optional for YouTube-only videos.'
              }
              rules={[
                {
                  validator: async (_, value) => {
                    if (!thumbnailRequired) return
                    if (!String(value || '').trim()) {
                      throw new Error('Thumbnail is required when uploading a video file')
                    }
                  },
                },
              ]}
            >
              <MediaUploader
                kind="thumbnail"
                folder="videos"
                label=""
                required={thumbnailRequired}
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
                tooltip="Lower number shows first (0, 1, 2…)"
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

            <Form.Item name="seo_title" label="SEO title" className="w-full">
              <Input className="w-full" />
            </Form.Item>
            <Form.Item name="seo_description" label="SEO description" className="w-full">
              <Input.TextArea className="w-full" rows={3} />
            </Form.Item>
            <Form.Item name="seo_keywords" label="SEO keywords" className="w-full">
              <Input className="w-full" />
            </Form.Item>

            {video ? (
              <p className="news-form-page__meta">Views: {video.view_count}</p>
            ) : null}

            <AppButton type="primary" htmlType="submit" loading={saving} block className="btn-soft-primary w-full">
              {mode === 'create' ? 'Create video' : 'Save changes'}
            </AppButton>
          </div>
        </div>
      </Form>
    </div>
  )
}

export function AdminVideoCreatePage() {
  return <AdminVideoFormPage mode="create" />
}

export function AdminVideoEditPage() {
  return <AdminVideoFormPage mode="edit" />
}
