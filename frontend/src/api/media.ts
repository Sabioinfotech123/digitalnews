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

export interface UploadMediaOptions {
  kind?: MediaUploadKind
  folder?: string
}

/** Convert File → binary FormData and upload via backend (S3 or local). */
export async function uploadMediaFile(
  file: File,
  options?: UploadMediaOptions,
): Promise<MediaUploadResult> {
  const kind = options?.kind ?? 'image'
  const formData = new FormData()
  formData.append('file', file)
  formData.append('kind', kind)
  formData.append('folder', options?.folder ?? 'news')

  const { data } = await apiClient.post<MediaUploadResult>('/admin/media/upload', formData, {
    timeout: UPLOAD_TIMEOUT_MS[kind],
  })
  return data
}
