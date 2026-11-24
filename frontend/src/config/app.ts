export const APP_CONFIG = {
  /** Axios baseURL — set in frontend/.env as VITE_API_URL */
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  /** Agent chat + OpenRouter failover can take several minutes */
  agentChatTimeoutMs: 300_000,
  defaultUiLanguage: 'en' as const,
  supportedLanguages: ['en', 'te'] as const,
  uiLanguageStorageKey: 'news.uiLanguage',
} as const

export type SupportedLanguage = (typeof APP_CONFIG.supportedLanguages)[number]

/** Public `/news` and category news lists: 12 per page, 4 pages max. */
export const PUBLIC_NEWS_PAGE_SIZE = 12
export const PUBLIC_NEWS_MAX_ITEMS = 48
