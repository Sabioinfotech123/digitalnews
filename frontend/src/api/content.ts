import { apiClient } from '@/api/client'
import type {
  Category,
  NewsItem,
  NewsPayload,
  PaginatedNews,
  TagItem,
} from '@/types/content'

export async function fetchAdminNews(params: {
  page?: number
  page_size?: number
  search?: string
  language?: string
  status?: string
  category_id?: string
  news_type?: string
}): Promise<PaginatedNews> {
  const { data } = await apiClient.get<PaginatedNews>('/admin/news', { params })
  return data
}

export async function fetchAdminNewsById(id: string): Promise<NewsItem> {
  const { data } = await apiClient.get<NewsItem>(`/admin/news/${id}`)
  return data
}

export async function createAdminNews(payload: NewsPayload): Promise<NewsItem> {
  const { data } = await apiClient.post<NewsItem>('/admin/news', payload)
  return data
}

export async function updateAdminNews(id: string, payload: Partial<NewsPayload>): Promise<NewsItem> {
  const { data } = await apiClient.patch<NewsItem>(`/admin/news/${id}`, payload)
  return data
}

export async function deleteAdminNews(id: string): Promise<void> {
  await apiClient.delete(`/admin/news/${id}`)
}

export async function fetchPublicNews(params: {
  page?: number
  page_size?: number
  search?: string
  language?: string
  category_id?: string
  news_type?: string
  is_breaking?: boolean
}): Promise<PaginatedNews> {
  const { data } = await apiClient.get<PaginatedNews>('/news', { params })
  return data
}

export async function fetchPublicNewsBySlug(
  slug: string,
  language?: string,
): Promise<NewsItem> {
  const { data } = await apiClient.get<NewsItem>(`/news/${slug}`, {
    params: language ? { language } : undefined,
  })
  return data
}

export async function fetchPublicNewsById(id: string): Promise<NewsItem> {
  const { data } = await apiClient.get<NewsItem>(`/news/by-id/${id}`)
  return data
}

export async function fetchCategories(search?: string): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories', { params: { search } })
  return data
}

export async function createCategory(payload: {
  name: string
  slug: string
  description?: string
  is_active?: boolean
}): Promise<Category> {
  const { data } = await apiClient.post<Category>('/admin/categories', payload)
  return data
}

export async function updateCategory(
  id: string,
  payload: Partial<{ name: string; slug: string; description: string; is_active: boolean }>,
): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/admin/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/admin/categories/${id}`)
}

export async function fetchTags(search?: string): Promise<TagItem[]> {
  const { data } = await apiClient.get<TagItem[]>('/tags', { params: { search } })
  return data
}

export async function createTag(payload: { name: string; slug: string }): Promise<TagItem> {
  const { data } = await apiClient.post<TagItem>('/admin/tags', payload)
  return data
}

export async function updateTag(
  id: string,
  payload: Partial<{ name: string; slug: string }>,
): Promise<TagItem> {
  const { data } = await apiClient.patch<TagItem>(`/admin/tags/${id}`, payload)
  return data
}

export async function deleteTag(id: string): Promise<void> {
  await apiClient.delete(`/admin/tags/${id}`)
}
