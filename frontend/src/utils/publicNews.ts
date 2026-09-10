import type { NewsItem, NewsType } from '@/types/content'
import type { SampleNewsArticle } from '@/constants/sampleNews'
import type { SupportedLanguage } from '@/config/app'

export interface PublicNewsCardModel {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  publishedLabel: string
  newsType: NewsType
  accent: string
  imageUrl?: string
  isBreaking?: boolean
}

const ACCENTS = [
  'linear-gradient(135deg, #1a1a1a 0%, #D71920 100%)',
  'linear-gradient(135deg, #0f3d5c 0%, #1a1a1a 100%)',
  'linear-gradient(135deg, #1f4d3a 0%, #111111 100%)',
  'linear-gradient(135deg, #5c3d0f 0%, #222222 100%)',
  'linear-gradient(135deg, #D71920 0%, #1a1a1a 90%)',
  'linear-gradient(135deg, #0d3b4c 0%, #111111 100%)',
]

export function stripHtml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function accentForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % ACCENTS.length
  }
  return ACCENTS[hash] ?? ACCENTS[0]
}

function formatPublishedLabel(iso: string | null, language: SupportedLanguage): string {
  if (!iso) return language === 'te' ? 'ఇప్పుడే' : 'Just now'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return language === 'te' ? 'ఇప్పుడే' : 'Just now'

  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return language === 'te' ? 'ఇప్పుడే' : 'Just now'
  if (mins < 60) return language === 'te' ? `${mins} నిమిషాల క్రితం` : `${mins} mins ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return language === 'te' ? `${hours} గంటల క్రితం` : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return language === 'te' ? 'నిన్న' : 'Yesterday'
  if (days < 7) return language === 'te' ? `${days} రోజుల క్రితం` : `${days} days ago`
  return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function mapApiNewsToCard(item: NewsItem, language: SupportedLanguage): PublicNewsCardModel {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: stripHtml(item.short_description) || stripHtml(item.content).slice(0, 160),
    category: item.category_name || (language === 'te' ? 'వార్తలు' : 'News'),
    publishedLabel: formatPublishedLabel(item.published_at || item.created_at, language),
    newsType: item.news_type,
    accent: accentForId(item.id),
    imageUrl: item.image_url || undefined,
    isBreaking: item.is_breaking,
  }
}

export function mapSampleNewsToCard(
  article: SampleNewsArticle,
  language: SupportedLanguage,
): PublicNewsCardModel {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title[language],
    excerpt: article.excerpt[language],
    category: article.category[language],
    publishedLabel: article.publishedLabel[language],
    newsType: article.newsType,
    accent: article.accent,
    imageUrl: article.imageUrl,
    isBreaking: article.isBreaking,
  }
}
