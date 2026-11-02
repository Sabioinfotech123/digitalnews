import { App, Form, type FormInstance } from 'antd'
import { useState } from 'react'
import { requestAiContent, type AiContentMode } from '@/api/aiContent'
import { AppEditor } from '@/components/common/AppEditor'
import { getApiErrorMessage } from '@/utils/apiError'
import './ContentFieldWithAi.scss'

type ContentFieldWithAiProps = {
  form: FormInstance
  disabled?: boolean
  placeholder?: string
  minHeight?: number
  /** Ant Design field name for the summary (videos use `description`). */
  shortDescriptionField?: string
}

export function ContentFieldWithAi({
  form,
  disabled = false,
  placeholder = 'Write the full article…',
  minHeight = 360,
  shortDescriptionField = 'short_description',
}: ContentFieldWithAiProps) {
  const { message, modal } = App.useApp()
  const [aiBusy, setAiBusy] = useState<AiContentMode | null>(null)

  const runAi = async (mode: AiContentMode) => {
    const title = String(form.getFieldValue('title') ?? '').trim()
    const short_description = form.getFieldValue(shortDescriptionField)
    const content = String(form.getFieldValue('content') ?? '')
    const language = form.getFieldValue('language') ?? 'en'

    if (title.length < 3) {
      message.warning('Add a title first so AI knows what the article is about.')
      return
    }

    if (mode === 'enhance') {
      const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (plain.length < 20) {
        message.warning('Write at least a few sentences in Content before enhancing.')
        return
      }
    } else {
      modal.confirm({
        title: 'Regenerate content?',
        content:
          'This replaces the current article body with a new AI draft from your title and short description.',
        okText: 'Regenerate',
        cancelText: 'Cancel',
        onOk: async () => {
          await execute(mode, title, short_description, content, language)
        },
      })
      return
    }

    await execute(mode, title, short_description, content, language)
  }

  const execute = async (
    mode: AiContentMode,
    title: string,
    short_description: unknown,
    content: string,
    language: string,
  ) => {
    setAiBusy(mode)
    try {
      const result = await requestAiContent({
        mode,
        title,
        short_description: typeof short_description === 'string' ? short_description : null,
        content,
        language,
      })
      form.setFieldsValue({ content: result.content })
      message.success(
        mode === 'enhance' ? 'Content enhanced — review before publishing.' : 'Content regenerated — review before publishing.',
      )
    } catch (err) {
      message.error(getApiErrorMessage(err, 'AI request failed'))
    } finally {
      setAiBusy(null)
    }
  }

  const busy = Boolean(aiBusy) || disabled

  return (
    <Form.Item
      name="content"
      label={
        <div className="content-field-ai__label">
          <span>Content</span>
          <div className="content-field-ai__actions">
            <span className="content-field-ai__chip" aria-hidden>
              <i className="fa-solid fa-wand-sparkles" aria-hidden />
              AI
            </span>
            <button
              type="button"
              className="content-field-ai__btn content-field-ai__btn--enhance"
              disabled={busy && aiBusy !== 'enhance'}
              onClick={() => void runAi('enhance')}
            >
              {aiBusy === 'enhance' ? (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden />
              ) : (
                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden />
              )}
              Enhance content
            </button>
            <button
              type="button"
              className="content-field-ai__btn content-field-ai__btn--regenerate"
              disabled={busy && aiBusy !== 'regenerate'}
              onClick={() => void runAi('regenerate')}
            >
              {aiBusy === 'regenerate' ? (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden />
              ) : (
                <i className="fa-solid fa-arrows-rotate" aria-hidden />
              )}
              Regenerate content
            </button>
          </div>
        </div>
      }
      rules={[{ required: true, message: 'Content is required' }]}
      className="content-field-ai w-full"
    >
      <AppEditor placeholder={placeholder} minHeight={minHeight} disabled={busy} />
    </Form.Item>
  )
}
