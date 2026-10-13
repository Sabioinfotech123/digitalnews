export type FeedbackCategory = 'general' | 'suggestion' | 'bug' | 'content' | 'other'

export type FeedbackStatus = 'new' | 'in_review' | 'resolved'

export interface FeedbackSubmitPayload {
  name?: string
  email?: string
  category: FeedbackCategory
  rating: number
  message: string
  page_url?: string | null
  website?: string
}

export interface FeedbackSubmitResponse {
  id: string
  message: string
}

export interface FeedbackItem {
  id: string
  user_id: string | null
  name: string
  email: string
  category: FeedbackCategory
  rating: number | null
  message: string
  page_url: string | null
  status: FeedbackStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedFeedback {
  items: FeedbackItem[]
  total: number
  page: number
  page_size: number
  new_count: number
}

export interface FeedbackUpdatePayload {
  status?: FeedbackStatus
  admin_note?: string | null
}
