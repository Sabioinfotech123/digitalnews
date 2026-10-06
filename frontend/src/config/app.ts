export const APP_CONFIG = {
  /** Axios baseURL — set in frontend/.env as VITE_API_URL */
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  defaultUiLanguage: 'en' as const,
  supportedLanguages: ['en', 'te'] as const,
  uiLanguageStorageKey: 'news.uiLanguage',
} as const

export type SupportedLanguage = (typeof APP_CONFIG.supportedLanguages)[number]
