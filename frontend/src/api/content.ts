import { apiClient } from '@/api/client'
import type {
  BlogItem,
  BlogPayload,
  BreakingNewsItem,
  BreakingNewsPayload,
  Category,
  NewsItem,
  NewsPayload,
  PaginatedBlogs,
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

export async function fetchAdminBlogs(params: {
  page?: number
  page_size?: number
  search?: string
  language?: string
  status?: string
  category_id?: string
}): Promise<PaginatedBlogs> {
  const { data } = await apiClient.get<PaginatedBlogs>('/admin/blogs', { params })
  return data
}

export async function fetchAdminBlogById(id: string): Promise<BlogItem> {
  const { data } = await apiClient.get<BlogItem>(`/admin/blogs/${id}`)
  return data
}

export async function createAdminBlog(payload: BlogPayload): Promise<BlogItem> {
  const { data } = await apiClient.post<BlogItem>('/admin/blogs', payload)
  return data
}

export async function updateAdminBlog(id: string, payload: Partial<BlogPayload>): Promise<BlogItem> {
  const { data } = await apiClient.patch<BlogItem>(`/admin/blogs/${id}`, payload)
  return data
}

export async function deleteAdminBlog(id: string): Promise<void> {
  await apiClient.delete(`/admin/blogs/${id}`)
}

export async function fetchPublicBlogs(params: {
  page?: number
  page_size?: number
  search?: string
  language?: string
  category_id?: string
}): Promise<PaginatedBlogs> {
  const { data } = await apiClient.get<PaginatedBlogs>('/blogs', { params })
  return data
}

export async function fetchPublicBlogBySlug(slug: string, language?: string): Promise<BlogItem> {
  const { data } = await apiClient.get<BlogItem>(`/blogs/${slug}`, {
    params: language ? { language } : undefined,
  })
  return data
}

export async function fetchPublicBlogById(id: string): Promise<BlogItem> {
  const { data } = await apiClient.get<BlogItem>(`/blogs/by-id/${id}`)
  return data
}

export async function fetchPublicBreakingNews(language?: string): Promise<BreakingNewsItem[]> {
  const { data } = await apiClient.get<BreakingNewsItem[]>('/breaking-news', {
    params: language ? { language } : undefined,
  })
  return data
}

export async function fetchAdminBreakingNews(params?: {
  search?: string
  language?: string
}): Promise<BreakingNewsItem[]> {
  const { data } = await apiClient.get<BreakingNewsItem[]>('/admin/breaking-news', { params })
  return data
}

export async function createBreakingNews(payload: BreakingNewsPayload): Promise<BreakingNewsItem> {
  const { data } = await apiClient.post<BreakingNewsItem>('/admin/breaking-news', payload)
  return data
}

export async function updateBreakingNews(
  id: string,
  payload: Partial<BreakingNewsPayload>,
): Promise<BreakingNewsItem> {
  const { data } = await apiClient.patch<BreakingNewsItem>(`/admin/breaking-news/${id}`, payload)
  return data
}

export async function deleteBreakingNews(id: string): Promise<void> {
  await apiClient.delete(`/admin/breaking-news/${id}`)
}
