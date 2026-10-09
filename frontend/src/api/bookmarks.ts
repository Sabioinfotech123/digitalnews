import { apiClient } from '@/api/client'
import type {
  BookmarkContentType,
  BookmarkItem,
  BookmarkKey,
  PaginatedBookmarks,
} from '@/types/bookmark'

export async function fetchBookmarkIds(): Promise<BookmarkKey[]> {
  const { data } = await apiClient.get<{ items: BookmarkKey[] }>('/bookmarks/ids')
  return data.items
}

export async function fetchBookmarks(params: {
  content_type?: BookmarkContentType
  page?: number
  page_size?: number
}): Promise<PaginatedBookmarks> {
  const { data } = await apiClient.get<PaginatedBookmarks>('/bookmarks', { params })
  return data
}

export async function addBookmark(
  content_type: BookmarkContentType,
  content_id: string,
): Promise<BookmarkItem> {
  const { data } = await apiClient.post<BookmarkItem>('/bookmarks', { content_type, content_id })
  return data
}

export async function removeBookmark(
  content_type: BookmarkContentType,
  content_id: string,
): Promise<void> {
  await apiClient.delete(`/bookmarks/${content_type}/${content_id}`)
}
