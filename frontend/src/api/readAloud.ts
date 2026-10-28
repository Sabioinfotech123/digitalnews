import { apiClient } from '@/api/client'
import type { SpeechLang } from '@/utils/speechText'

export type ReadAloudCapabilities = {
  polly: boolean
  polly_reason?: string | null
}

export async function fetchReadAloudCapabilities(): Promise<ReadAloudCapabilities> {
  const { data } = await apiClient.get<ReadAloudCapabilities>('/read-aloud/capabilities')
  return data
}

export function readAloudErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null
  const ax = err as { response?: { data?: unknown; status?: number } }
  const data = ax.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
  }
  return null
}

export async function synthesizeReadAloud(text: string, language: SpeechLang): Promise<Blob> {
  const { data } = await apiClient.post<ArrayBuffer>(
    '/read-aloud/synthesize',
    { text, language },
    {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    },
  )
  return new Blob([data], { type: 'audio/mpeg' })
}
