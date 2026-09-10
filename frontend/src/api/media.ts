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

/** Convert File → binary FormData and upload via backend (S3 or local). */
export async function uploadMediaFile(
  file: File,
  options?: { kind?: MediaUploadKind; folder?: string },
): Promise<MediaUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('kind', options?.kind ?? 'image')
  formData.append('folder', options?.folder ?? 'news')

  const { data } = await apiClient.post<MediaUploadResult>('/admin/media/upload', formData)
  return data
}
