import { App, Upload } from 'antd'
import type { UploadProps } from 'antd'
import axios from 'axios'
import { useState } from 'react'
import { uploadMediaFile, type MediaUploadKind } from '@/api/media'
import { AppButton } from '@/components/common/AppButton'
import { getApiErrorMessage } from '@/utils/apiError'
import './MediaUploader.scss'

interface MediaUploaderProps {
  value?: string | null
  onChange?: (url: string | null) => void
  /** image = news photo; thumbnail = optional thumb; video = mp4/webm */
  kind?: MediaUploadKind
  folder?: string
  label?: string
  required?: boolean
  accept?: string
  /** When true, reject files that are not ~16:9 */
  requireSixteenNine?: boolean
}

const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon'
const VIDEO_ACCEPT = 'video/mp4,video/webm'
const ASPECT_16_9 = 16 / 9
const ASPECT_9_16 = 9 / 16
const ASPECT_TOLERANCE = 0.04

function isSixteenByNine(width: number, height: number): boolean {
  if (!width || !height) return false
  return Math.abs(width / height - ASPECT_16_9) <= ASPECT_TOLERANCE
}

function isNineBySixteen(width: number, height: number): boolean {
  if (!width || !height) return false
  return Math.abs(width / height - ASPECT_9_16) <= ASPECT_TOLERANCE
}

function readVideoAspect(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const width = video.videoWidth
      const height = video.videoHeight
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video dimensions'))
    }
    video.src = url
  })
}

function readImageAspect(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions'))
    }
    img.src = url
  })
}

async function assertVideoSixteenByNine(file: File): Promise<void> {
  const dims = await readVideoAspect(file)
  if (!isSixteenByNine(dims.width, dims.height)) {
    throw new Error('Only 16:9 videos are allowed. Please upload a 16:9 file.')
  }
}

/** Thumbnails: any size except vertical 9:16. */
async function assertThumbnailNotNineBySixteen(file: File): Promise<void> {
  const dims = await readImageAspect(file)
  if (isNineBySixteen(dims.width, dims.height)) {
    throw new Error('9:16 (vertical) thumbnails are not allowed. Please use another size.')
  }
}

function uploadErrorMessage(err: unknown, isVideo: boolean): string {
  if (err instanceof Error && (/16:9|9:16/.test(err.message))) {
    return err.message
  }
  if (axios.isAxiosError(err) && (err.code === 'ECONNABORTED' || /timeout/i.test(err.message))) {
    return isVideo
      ? 'Upload timed out. Use a smaller file or check your connection, then try again.'
      : 'Upload timed out. Please try again.'
  }
  return getApiErrorMessage(err, isVideo ? 'Video upload failed' : 'File upload failed')
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  const mb = bytes / (1024 * 1024)
  if (mb < 0.1) {
    const kb = bytes / 1024
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  }
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

export function MediaUploader({
  value,
  onChange,
  kind = 'image',
  folder = 'news',
  label = 'Image',
  required = false,
  accept,
  requireSixteenNine = false,
}: MediaUploaderProps) {
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)
  const [loadedBytes, setLoadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const isVideo = kind === 'video'
  const isThumbnail = kind === 'thumbnail'
  const enforceVideoSixteenNine = requireSixteenNine || isVideo
  const resolvedAccept = accept ?? (isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT)

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const total = (file as File).size
    setUploading(true)
    setLoadedBytes(0)
    setTotalBytes(total)

    // Keep the size counter moving while API↔S3 works (XHR often jumps to 100% early).
    const startedAt = Date.now()
    const bytesPerSec = Math.max(320 * 1024, Math.min(total / 6, 1.25 * 1024 * 1024))
    let reportedLoaded = 0
    const tick = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const estimated = Math.min(total * 0.99, Math.floor(elapsed * bytesPerSec))
      setLoadedBytes((prev) => Math.max(prev, reportedLoaded, estimated))
    }, 200)

    try {
      if (enforceVideoSixteenNine) {
        await assertVideoSixteenByNine(file as File)
      } else if (isThumbnail) {
        await assertThumbnailNotNineBySixteen(file as File)
      }
      const result = await uploadMediaFile(file as File, {
        kind,
        folder,
        onProgress: (loaded, progressTotal) => {
          reportedLoaded = loaded
          setTotalBytes(progressTotal)
          setLoadedBytes((prev) => Math.max(prev, loaded))
        },
      })
      setLoadedBytes(total)
      onChange?.(result.url)
      message.success(isVideo ? 'Video uploaded successfully' : 'File uploaded successfully')
    } catch (err) {
      message.error(uploadErrorMessage(err, isVideo))
    } finally {
      window.clearInterval(tick)
      setUploading(false)
      setLoadedBytes(0)
      setTotalBytes(0)
    }
    return false
  }

  const changeButton = (
    <Upload
      accept={resolvedAccept}
      multiple={false}
      showUploadList={false}
      beforeUpload={beforeUpload}
      disabled={uploading}
    >
      <AppButton size="small" disabled={uploading}>
        Change
      </AppButton>
    </Upload>
  )

  const progressLabel =
    totalBytes > 0
      ? `${formatBytes(Math.min(loadedBytes, totalBytes))} / ${formatBytes(totalBytes)}`
      : 'Uploading…'

  const loaderBlock = (overlay = false) =>
    uploading ? (
      <div
        className={`media-uploader__progress${overlay ? ' media-uploader__progress--overlay' : ''}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="media-uploader__progress-size">{progressLabel}</p>
        <p className="media-uploader__progress-text">Uploading…</p>
      </div>
    ) : null

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
        <div className={`media-uploader__preview${isVideo ? ' media-uploader__preview--video' : ''}`}>
          {isVideo ? (
            <video
              src={value}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
            />
          ) : (
            <img src={value} alt="" />
          )}
          <div className="media-uploader__actions">
            {required ? (
              changeButton
            ) : (
              <>
                {changeButton}
                <AppButton
                  size="small"
                  danger
                  onClick={() => onChange?.(null)}
                  disabled={uploading}
                >
                  Remove
                </AppButton>
              </>
            )}
          </div>
          {loaderBlock(true)}
        </div>
      ) : (
        <div className={`media-uploader__drop-wrap${uploading ? ' is-uploading' : ''}`}>
          <Upload.Dragger
            accept={resolvedAccept}
            multiple={false}
            showUploadList={false}
            beforeUpload={beforeUpload}
            disabled={uploading}
            className="media-uploader__drop"
          >
            <p className="media-uploader__icon">
              <i
                className={isVideo ? 'fa-solid fa-film' : 'fa-solid fa-cloud-arrow-up'}
                aria-hidden
              />
            </p>
            <p className="media-uploader__hint">
              {isVideo ? 'Click or drop a video' : 'Click or drop an image'}
            </p>
            <p className="media-uploader__sub">
              {isVideo
                ? 'MP4, WEBM · 16:9 only · max 100MB'
                : isThumbnail
                  ? 'JPG, PNG, WEBP · any size except 9:16 · max 5MB'
                  : 'JPG, PNG, WEBP, GIF, ICO · max 5MB'}
            </p>
          </Upload.Dragger>
          {loaderBlock()}
        </div>
      )}
    </div>
  )
}
