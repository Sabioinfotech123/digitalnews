import { apiClient } from '@/api/client'

export interface MediaUploadResult {
  key: string
  url: string
  content_type: string
  size_bytes: number
  original_filename: string
  media_kind: string
}

export type MediaUploadKind = 'image' | 'thumbnail' | 'video'

/** Video uploads can take several minutes (up to ~100MB). Default API client is 20s. */
const UPLOAD_TIMEOUT_MS: Record<MediaUploadKind, number> = {
  image: 120_000,
  thumbnail: 120_000,
  video: 600_000,
}

/** S3 min part size (except last). Matches backend S3_MULTIPART_MIN_PART. */
const VIDEO_PART_SIZE = 5 * 1024 * 1024

export interface UploadMediaOptions {
  kind?: MediaUploadKind
  folder?: string
  onProgress?: (loaded: number, total: number) => void
  signal?: AbortSignal
  /** Called when multipart session starts (video) so the UI can abort S3 parts. */
  onMultipartSession?: (sessionId: string | null) => void
}

export async function abortMultipartUpload(sessionId: string): Promise<void> {
  try {
    await apiClient.post(`/admin/media/multipart/${sessionId}/abort`)
  } catch {
    // ignore
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Upload cancelled', 'AbortError')
  }
}

interface MultipartStartResult {
  session_id: string
  key: string
  part_size: number
  size_bytes: number
}

async function uploadViaApi(
  file: File,
  kind: MediaUploadKind,
  folder: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<MediaUploadResult> {
  throwIfAborted(signal)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('kind', kind)
  formData.append('folder', folder)

  const { data } = await apiClient.post<MediaUploadResult>('/admin/media/upload', formData, {
    timeout: UPLOAD_TIMEOUT_MS[kind],
    signal,
    onUploadProgress: (event) => {
      const total = event.total && event.total > 0 ? event.total : file.size
      // Ignore premature 100% — body queued ≠ S3 finish.
      if (event.loaded < total) {
        onProgress?.(event.loaded, total)
      }
    },
  })
  onProgress?.(file.size, file.size)
  return data
}

async function uploadVideoMultipart(
  file: File,
  folder: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
  onMultipartSession?: (sessionId: string | null) => void,
): Promise<MediaUploadResult> {
  const total = file.size
  onProgress?.(0, total)
  throwIfAborted(signal)

  const { data: started } = await apiClient.post<MultipartStartResult>(
    '/admin/media/multipart/start',
    {
      kind: 'video',
      folder,
      filename: file.name || 'video.mp4',
      content_type: file.type || 'video/mp4',
      size_bytes: total,
    },
    { signal },
  )
  onMultipartSession?.(started.session_id)

  const partSize = started.part_size || VIDEO_PART_SIZE
  let offset = 0
  let partNumber = 1

  try {
    while (offset < total) {
      throwIfAborted(signal)
      const remaining = total - offset
      const end = remaining > partSize ? offset + partSize : total
      const chunk = file.slice(offset, end)
      const chunkSize = chunk.size
      const base = offset

      const formData = new FormData()
      formData.append('file', chunk, `part-${partNumber}`)

      await apiClient.post(
        `/admin/media/multipart/${started.session_id}/parts/${partNumber}`,
        formData,
        {
          timeout: UPLOAD_TIMEOUT_MS.video,
          signal,
          onUploadProgress: (event) => {
            const loadedInPart = event.loaded || 0
            const visible = Math.min(base + loadedInPart, base + chunkSize - 1)
            onProgress?.(visible, total)
          },
        },
      )

      offset = end
      onProgress?.(offset, total)
      partNumber += 1
    }

    throwIfAborted(signal)
    const { data } = await apiClient.post<MediaUploadResult>(
      '/admin/media/multipart/complete',
      { session_id: started.session_id },
      { signal },
    )
    onMultipartSession?.(null)
    onProgress?.(total, total)
    return data
  } catch (err) {
    onMultipartSession?.(null)
    const aborted = signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')
    try {
      await apiClient.post(`/admin/media/multipart/${started.session_id}/abort`)
    } catch {
      // ignore abort errors
    }
    if (aborted) {
      throw new DOMException('Upload cancelled', 'AbortError')
    }
    throw err
  }
}

/** Convert File → binary upload. Videos use chunked S3 multipart so size ticks up. */
export async function uploadMediaFile(
  file: File,
  options?: UploadMediaOptions,
): Promise<MediaUploadResult> {
  const kind = options?.kind ?? 'image'
  const folder = options?.folder ?? 'news'
  const onProgress = options?.onProgress
  const signal = options?.signal

  if (kind === 'video') {
    return uploadVideoMultipart(
      file,
      folder,
      onProgress,
      signal,
      options?.onMultipartSession,
    )
  }

  return uploadViaApi(file, kind, folder, onProgress, signal)
}
