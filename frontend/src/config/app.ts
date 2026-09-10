export const APP_CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  defaultUiLanguage: 'en' as const,
  supportedLanguages: ['en', 'te'] as const,
  uiLanguageStorageKey: 'news.uiLanguage',
} as const

export type SupportedLanguage = (typeof APP_CONFIG.supportedLanguages)[number]
