import type { VideoItem } from '@/types/content'
import type { SupportedLanguage } from '@/config/app'
import { stripHtml } from '@/utils/publicNews'

export type PublicVideoSource = 'website' | 'youtube' | 'both'

export interface PublicVideoCardModel {
  id: string
  slug: string
  title: string
  description: string
  category: string
  publishedLabel: string
  source: PublicVideoSource
  accent: string
  thumbnailUrl?: string
  videoUrl?: string
  youtubeUrl?: string
}

const ACCENTS = [
  'linear-gradient(135deg, #D71920 0%, #111111 100%)',
  'linear-gradient(135deg, #1a1a1a 0%, #D71920 100%)',
  'linear-gradient(135deg, #0f3d5c 0%, #1a1a1a 100%)',
  'linear-gradient(135deg, #1f4d3a 0%, #111111 100%)',
  'linear-gradient(135deg, #5c3d0f 0%, #222222 100%)',
  'linear-gradient(135deg, #0d3b4c 0%, #111111 100%)',
]

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

function resolveSource(item: VideoItem): PublicVideoSource {
  const hasFile = Boolean(item.video_url?.trim())
  const hasYt = Boolean(item.youtube_url?.trim())
  if (hasFile && hasYt) return 'both'
  if (hasYt) return 'youtube'
  return 'website'
}

export function mapApiVideoToCard(item: VideoItem, language: SupportedLanguage): PublicVideoCardModel {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: stripHtml(item.description) || stripHtml(item.content).slice(0, 160),
    category: item.category_name || (language === 'te' ? 'వీడియో' : 'Video'),
    publishedLabel: formatPublishedLabel(item.published_at || item.created_at, language),
    source: resolveSource(item),
    accent: accentForId(item.id),
    thumbnailUrl: item.thumbnail_url || undefined,
    videoUrl: item.video_url?.trim() || undefined,
    youtubeUrl: item.youtube_url?.trim() || undefined,
  }
}
