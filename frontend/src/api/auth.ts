import { apiClient } from '@/api/client'
import type { AuthResponse, AuthUser, DashboardStats, TokenPair, UserRole } from '@/types/auth'

const ACCESS_KEY = 'news.accessToken'
const REFRESH_KEY = 'news.refreshToken'

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function storeTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function registerRequest(
  email: string,
  password: string,
  full_name: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    full_name,
  })
  return data
}

export async function refreshRequest(refreshToken: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me')
  return data
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/admin/dashboard')
  return data
}

export interface AdminUserPayload {
  email: string
  password?: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export async function fetchAdminUsers(search?: string): Promise<AuthUser[]> {
  const { data } = await apiClient.get<AuthUser[]>('/admin/users', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function createAdminUser(payload: AdminUserPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>('/admin/users', payload)
  return data
}

export async function updateAdminUser(id: string, payload: Partial<AdminUserPayload>): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>(`/admin/users/${id}`, payload)
  return data
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`)
}
