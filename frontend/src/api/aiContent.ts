import { apiClient } from '@/api/client'

export type AiContentMode = 'enhance' | 'regenerate'

export async function requestAiContent(payload: {
  mode: AiContentMode
  title: string
  short_description?: string | null
  content?: string
  language?: string
}): Promise<{ content: string; provider: string }> {
  const { data } = await apiClient.post<{ content: string; provider: string }>('/admin/ai/content', {
    mode: payload.mode,
    title: payload.title,
    short_description: payload.short_description ?? null,
    content: payload.content ?? '',
    language: payload.language ?? 'en',
  })
  return data
}
