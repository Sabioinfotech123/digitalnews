import { App, Spin, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useState } from 'react'
import { uploadMediaFile, type MediaUploadKind } from '@/api/media'
import { AppButton } from '@/components/common/AppButton'
import './MediaUploader.scss'

interface MediaUploaderProps {
  value?: string | null
  onChange?: (url: string | null) => void
  /** image = required news photo; thumbnail = optional video thumb */
  kind?: MediaUploadKind
  folder?: string
  label?: string
  required?: boolean
  accept?: string
}

export function MediaUploader({
  value,
  onChange,
  kind = 'image',
  folder = 'news',
  label = 'Image',
  required = false,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon',
}: MediaUploaderProps) {
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    setUploading(true)
    try {
      const result = await uploadMediaFile(file as File, { kind, folder })
      onChange?.(result.url)
      message.success(kind === 'image' ? 'Image uploaded successfully' : 'File uploaded successfully')
    } catch {
      message.error(kind === 'image' ? 'Image upload failed' : 'File upload failed')
    } finally {
      setUploading(false)
    }
    return false
  }

  return (
    <div className="media-uploader">
      <div className="media-uploader__label">
        {label ? (
          <>
            {label}
            {required ? <span className="media-uploader__required"> *</span> : null}
            {!required ? <span className="media-uploader__optional"> (optional)</span> : null}
          </>
        ) : null}
      </div>

      {value ? (
        <div className="media-uploader__preview">
          <img src={value} alt="" />
          <div className="media-uploader__actions">
            {required ? (
              <Upload
                accept={accept}
                multiple={false}
                showUploadList={false}
                beforeUpload={beforeUpload}
                disabled={uploading}
              >
                <AppButton size="small" disabled={uploading}>
                  Change
                </AppButton>
              </Upload>
            ) : (
              <AppButton
                size="small"
                danger
                onClick={() => onChange?.(null)}
                disabled={uploading}
              >
                Remove
              </AppButton>
            )}
          </div>
        </div>
      ) : (
        <Spin spinning={uploading}>
          <Upload.Dragger
            accept={accept}
            multiple={false}
            showUploadList={false}
            beforeUpload={beforeUpload}
            disabled={uploading}
            className="media-uploader__drop"
          >
            <p className="media-uploader__icon">
              <i className="fa-solid fa-cloud-arrow-up" aria-hidden />
            </p>
            <p className="media-uploader__hint">Click or drop an image</p>
            <p className="media-uploader__sub">JPG, PNG, WEBP, GIF, ICO · max 5MB</p>
          </Upload.Dragger>
        </Spin>
      )}
    </div>
  )
}
