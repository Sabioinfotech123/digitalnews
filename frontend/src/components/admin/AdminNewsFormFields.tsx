import { Form, Input, InputNumber, Select, Switch } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { CategoryFormSelect } from '@/components/admin/CategoryFormSelect'
import { ContentFieldWithAi } from '@/components/admin/ContentFieldWithAi'
import { AppButton } from '@/components/common/AppButton'
import { MediaUploader } from '@/components/common/MediaUploader'
import type { NewsItem, NewsPayload, TagItem } from '@/types/content'
import { NEWS_TYPES } from '@/types/content'

export interface AdminNewsFormFieldsProps {
  form: FormInstance<NewsPayload>
  mode: 'create' | 'edit'
  typeLocked: boolean
  tags: TagItem[]
  loading: boolean
  saving: boolean
  news?: NewsItem | null
  onTitleBlur: (value: string) => void
  contentMinHeight?: number
  submitLabel?: string
  onCategoriesMissing?: () => void
  /** When false, parent supplies submit (e.g. modal footer). Default true. */
  showSubmitButton?: boolean
}

export function AdminNewsFormFields({
  form,
  mode,
  typeLocked,
  tags,
  loading,
  saving,
  news,
  onTitleBlur,
  contentMinHeight = 360,
  submitLabel,
  onCategoriesMissing,
  showSubmitButton = true,
}: AdminNewsFormFieldsProps) {
  const primaryLabel =
    submitLabel ?? (mode === 'create' ? 'Create news' : 'Save changes')

  return (
    <div className="news-form-page__grid grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6">
      <div className="news-form-page__main flex flex-col lg:col-span-8">
        <Form.Item name="title" label="Title" rules={[{ required: true, min: 3 }]} className="w-full">
          <Input
            size="large"
            className="w-full"
            onBlur={(e) => onTitleBlur(e.target.value)}
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

        <ContentFieldWithAi
          form={form}
          disabled={loading || saving}
          placeholder="Write the full article…"
          minHeight={contentMinHeight}
        />
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

          {mode === 'edit' ? (
            <Form.Item
              name="sort_order"
              label="Display order"
              tooltip="Lower number shows first in this type list. Same number as another item (same language) swaps. New items are placed at 1 automatically."
              className="w-full"
            >
              <InputNumber min={0} step={1} className="!w-full" />
            </Form.Item>
          ) : (
            <div />
          )}
        </div>

        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true, message: 'Category is required' }]}
          className="w-full"
        >
          <CategoryFormSelect
            className="w-full"
            disabled={loading || saving}
            onCategoriesLoaded={(cats) => {
              if (mode === 'create' && !cats.length) onCategoriesMissing?.()
            }}
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

        {showSubmitButton ? (
          <AppButton type="primary" htmlType="submit" loading={saving} block className="btn-soft-primary w-full">
            {primaryLabel}
          </AppButton>
        ) : null}
      </div>
    </div>
  )
}