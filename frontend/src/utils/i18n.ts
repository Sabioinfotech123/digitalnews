import type { SupportedLanguage } from '@/config/app'
import { admin as enAdmin } from '@/locales/en/admin'
import { auth as enAuth } from '@/locales/en/auth'
import { blogs as enBlogs } from '@/locales/en/blogs'
import { common as enCommon } from '@/locales/en/common'
import { navigation as enNavigation } from '@/locales/en/navigation'
import { news as enNews } from '@/locales/en/news'
import { videos as enVideos } from '@/locales/en/videos'
import { admin as teAdmin } from '@/locales/te/admin'
import { auth as teAuth } from '@/locales/te/auth'
import { blogs as teBlogs } from '@/locales/te/blogs'
import { common as teCommon } from '@/locales/te/common'
import { navigation as teNavigation } from '@/locales/te/navigation'
import { news as teNews } from '@/locales/te/news'
import { videos as teVideos } from '@/locales/te/videos'

const catalogs = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    news: enNews,
    videos: enVideos,
    blogs: enBlogs,
    admin: enAdmin,
  },
  te: {
    common: teCommon,
    navigation: teNavigation,
    auth: teAuth,
    news: teNews,
    videos: teVideos,
    blogs: teBlogs,
    admin: teAdmin,
  },
} as const

type Catalog = (typeof catalogs)['en']
type Namespace = keyof Catalog

export type TranslationKey = {
  [N in Namespace]: `${N & string}.${keyof Catalog[N] & string}`
}[Namespace]

export function translate(language: SupportedLanguage, key: TranslationKey): string {
  const [namespace, entry] = key.split('.') as [Namespace, string]
  const bundle = catalogs[language][namespace] as Record<string, string>
  return bundle[entry] ?? catalogs.en[namespace][entry as keyof Catalog[typeof namespace]] ?? key
}
