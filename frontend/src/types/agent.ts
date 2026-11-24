import type { ContentLanguage, NewsType } from '@/types/content'

export type AgentRuntimeStatus = 'stopped' | 'running' | 'paused'

export type AgentControlAction = 'start' | 'stop' | 'pause' | 'resume' | 'refetch'

export type AgentFeed = 'trending' | 'latest' | 'viral'

export interface AgentSuggestion {
  id: string
  title: string
  description: string | null
  url: string
  image_url: string | null
  source_name: string | null
  published_at: string | null
  feed: AgentFeed
}

export interface AgentStatusResponse {
  status: AgentRuntimeStatus
  suggestions_count: number
  last_fetch_at: string | null
  next_fetch_at: string | null
  refetch_interval_minutes: number
  openrouter_configured: boolean
  models: string[]
}

export interface AgentCredibility {
  title: string
  real_percent: number
  fake_percent: number
  verdict: 'likely_real' | 'likely_fake' | 'uncertain'
  summary: string
}

export interface AgentDraftFields {
  title: string
  slug: string
  short_description: string
  content: string
  news_type: NewsType
  language: ContentLanguage
  image_url: string | null
  seo_title: string | null
  seo_description: string | null
  source_url: string | null
  source_name: string | null
}

export interface AgentChatResponse {
  assistant_message: string
  credibility: AgentCredibility
  draft: AgentDraftFields
  model_used: string
}

export interface AgentNewsPrefill {
  title: string
  slug: string
  short_description: string
  content: string
  news_type: NewsType
  language: ContentLanguage
  image_url?: string | null
  seo_title?: string | null
  seo_description?: string | null
  status: 'draft'
}