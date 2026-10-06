import axios from 'axios'
import { clearTokens, getStoredAccessToken, getStoredRefreshToken, refreshRequest, storeTokens } from '@/api/auth'
import { APP_CONFIG } from '@/config/app'

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    // Let the browser set multipart boundary
    delete config.headers['Content-Type']
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return /\/auth\/(login|register|refresh)(?:\?|$)/.test(url)
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    clearTokens()
    return null
  }
  try {
    const tokens = await refreshRequest(refreshToken)
    storeTokens(tokens)
    return tokens.access_token
  } catch {
    clearTokens()
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthEndpoint(original.url)
    ) {
      return Promise.reject(error)
    }
    original._retry = true
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })
    const accessToken = await refreshPromise
    if (!accessToken) {
      return Promise.reject(error)
    }
    original.headers.Authorization = `Bearer ${accessToken}`
    return apiClient(original)
  },
)

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health')
  return data
}
