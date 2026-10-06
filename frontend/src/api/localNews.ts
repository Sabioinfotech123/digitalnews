import { apiClient } from '@/api/client'
import type {
  LocalNewsArticle,
  LocalNewsImportPayload,
  LocalNewsImportResponse,
  LocalNewsListResponse,
  LocalNewsStateOption,
  LocalNewsVerifyResponse,
  PaginatedVerifiedLocalNews,
  VerifiedLocalNewsItem,
} from '@/types/localNews'

export async function fetchLocalNewsStates(): Promise<LocalNewsStateOption[]> {
  const { data } = await apiClient.get<LocalNewsStateOption[]>('/admin/local-news/states')
  return data
}

export async function fetchLocalNews(params: {
  state?: string
  q?: string
  from_date?: string
  to_date?: string
  page?: number
  page_size?: number
}): Promise<LocalNewsListResponse> {
  const { data } = await apiClient.get<LocalNewsListResponse>('/admin/local-news', { params })
  return data
}

export async function fetchLocalNewsById(id: string): Promise<LocalNewsArticle> {
  const { data } = await apiClient.get<LocalNewsArticle>(`/admin/local-news/${id}`)
  return data
}

export async function importLocalNews(
  id: string,
  payload: LocalNewsImportPayload,
): Promise<LocalNewsImportResponse> {
  const { data } = await apiClient.post<LocalNewsImportResponse>(
    `/admin/local-news/${id}/import`,
    payload,
  )
  return data
}

export async function verifyLocalNews(id: string): Promise<LocalNewsVerifyResponse> {
  const { data } = await apiClient.post<LocalNewsVerifyResponse>(`/admin/local-news/${id}/verify`)
  return data
}

export async function fetchVerifiedNews(params: {
  search?: string
  verdict?: string
  page?: number
  page_size?: number
}): Promise<PaginatedVerifiedLocalNews> {
  const { data } = await apiClient.get<PaginatedVerifiedLocalNews>('/admin/verified-news', {
    params,
  })
  return data
}

export async function fetchVerifiedNewsById(id: string): Promise<VerifiedLocalNewsItem> {
  const { data } = await apiClient.get<VerifiedLocalNewsItem>(`/admin/verified-news/${id}`)
  return data
}

export async function importVerifiedNews(
  id: string,
  payload: LocalNewsImportPayload,
): Promise<LocalNewsImportResponse> {
  const { data } = await apiClient.post<LocalNewsImportResponse>(
    `/admin/verified-news/${id}/import`,
    payload,
  )
  return data
}
