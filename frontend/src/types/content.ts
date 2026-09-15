export type ContentLanguage = 'en' | 'te'
export type ContentStatus = 'draft' | 'published' | 'unpublished' | 'scheduled'
export type NewsType = 'featured' | 'latest' | 'trending' | 'more'

export const NEWS_TYPES: { value: NewsType; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Trending' },
  { value: 'more', label: 'More' },
]

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface TagItem {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface NewsItem {
  id: string
  title: string
  slug: string
  language: ContentLanguage
  short_description: string | null
  content: string
  category_id: string | null
  category_name: string | null
  author_id: string | null
  author_name: string | null
  status: ContentStatus
  news_type: NewsType
  is_featured: boolean
  is_breaking: boolean
  image_url: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
  tags: TagItem[]
}

export interface PaginatedNews {
  items: NewsItem[]
  total: number
  page: number
  page_size: number
}

export interface NewsPayload {
  title: string
  slug: string
  language: ContentLanguage
  short_description?: string | null
  content?: string
  category_id?: string | null
  tag_ids?: string[]
  status?: ContentStatus
  news_type?: NewsType
  is_featured?: boolean
  is_breaking?: boolean
  image_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
  published_at?: string | null
}

export interface BlogItem {
  id: string
  title: string
  slug: string
  language: ContentLanguage
  short_description: string | null
  content: string
  category_id: string | null
  category_name: string | null
  author_id: string | null
  author_name: string | null
  status: ContentStatus
  image_url: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
  tags: TagItem[]
}

export interface PaginatedBlogs {
  items: BlogItem[]
  total: number
  page: number
  page_size: number
}

export interface BlogPayload {
  title: string
  slug: string
  language: ContentLanguage
  short_description?: string | null
  content?: string
  category_id?: string | null
  tag_ids?: string[]
  status?: ContentStatus
  image_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
  published_at?: string | null
}
