import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { APP_CONFIG, type SupportedLanguage } from '@/config/app'
import { translate, type TranslationKey } from '@/utils/i18n'

interface LanguageContextValue {
  uiLanguage: SupportedLanguage
  contentLanguage: SupportedLanguage
  setUiLanguage: (language: SupportedLanguage) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(APP_CONFIG.uiLanguageStorageKey)
  if (stored === 'en' || stored === 'te') {
    return stored
  }
  return APP_CONFIG.defaultUiLanguage
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUiLanguageState] = useState<SupportedLanguage>(readStoredLanguage)

  const setUiLanguage = useCallback((language: SupportedLanguage) => {
    setUiLanguageState(language)
    localStorage.setItem(APP_CONFIG.uiLanguageStorageKey, language)
  }, [])

  useEffect(() => {
    document.documentElement.lang = uiLanguage
  }, [uiLanguage])

  const value = useMemo<LanguageContextValue>(
    () => ({
      uiLanguage,
      // Public default: content language follows UI language
      contentLanguage: uiLanguage,
      setUiLanguage,
      t: (key) => translate(uiLanguage, key),
    }),
    [uiLanguage, setUiLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
