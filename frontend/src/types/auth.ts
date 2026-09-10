export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: TokenPair
}

export interface DashboardStats {
  total_news: number
  published_news: number
  draft_news: number
  total_blogs: number
  total_videos: number
  total_users: number
  total_views: number
}
