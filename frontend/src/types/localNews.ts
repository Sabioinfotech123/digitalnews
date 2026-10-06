export interface LocalNewsArticle {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string
  image_url: string | null
  source_name: string | null
  published_at: string | null
  language: string | null
  country: string | null
  is_verified?: boolean
  verified_id?: string | null
  verdict?: string | null
}

export interface LocalNewsListResponse {
  items: LocalNewsArticle[]
  total: number
  page: number
  page_size: number
  state: string
  query: string
  provider: string
}

export interface LocalNewsStateOption {
  value: string
  label: string
}

export interface LocalNewsImportPayload {
  news_type: 'featured' | 'latest' | 'trending' | 'more'
  language?: 'en' | 'te'
  status?: 'draft' | 'published'
  category_id?: string | null
  tag_ids?: string[]
  is_breaking?: boolean
  title?: string
  slug?: string
  short_description?: string | null
  content?: string | null
  image_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string | null
}

export interface LocalNewsImportResponse {
  news_id: string
  slug: string
  news_type: string
  status: string
  title: string
  message: string
}

export type VerifyVerdict = 'likely_real' | 'likely_fake' | 'uncertain'

export interface VerifiedLocalNewsItem {
  id: string
  external_id: string
  title: string
  description: string | null
  url: string
  image_url: string | null
  source_name: string | null
  published_at: string | null
  country: string | null
  verdict: VerifyVerdict | string
  confidence: number
  ai_summary: string | null
  ai_provider: string
  verified_at: string
  created_at: string
  updated_at: string
}

export interface PaginatedVerifiedLocalNews {
  items: VerifiedLocalNewsItem[]
  total: number
  page: number
  page_size: number
}

export interface LocalNewsVerifyResponse {
  item: VerifiedLocalNewsItem
  message: string
}
