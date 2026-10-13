export type BookmarkContentType = 'news' | 'blog' | 'video'

export interface BookmarkKey {
  content_type: BookmarkContentType
  content_id: string
}

export interface BookmarkItem {
  id: string
  content_type: BookmarkContentType
  content_id: string
  title: string
  slug: string
  language: string
  image_url: string | null
  category_name: string | null
  saved_at: string
  is_available: boolean
}

export interface PaginatedBookmarks {
  items: BookmarkItem[]
  total: number
  page: number
  page_size: number
}
