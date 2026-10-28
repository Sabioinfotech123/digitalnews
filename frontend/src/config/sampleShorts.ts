import type { SupportedLanguage } from '@/config/app'
import type { VideoItem } from '@/types/content'
import {
  mapApiVideoToCard,
  mapApiVideoToShortCard,
  type PublicShortCardModel,
  type PublicVideoCardModel,
} from '@/utils/publicVideo'

import shorts1 from '@/assets/shorts/shorts1.mp4'
import shorts2 from '@/assets/shorts/shorts2.mp4'
import shorts3 from '@/assets/shorts/shorts3.mp4'
import shorts4 from '@/assets/shorts/shorts4.mp4'
import shorts5 from '@/assets/shorts/shorts5.mp4'

/**
 * When the public shorts API is empty or fails, fall back to local files in `src/assets/shorts`.
 * Set `VITE_USE_SAMPLE_SHORTS=false` in `.env` to disable fallback (show empty/error only).
 */
export const SAMPLE_SHORTS_FALLBACK =
  import.meta.env.VITE_USE_SAMPLE_SHORTS === 'false' ? false : true

/** @deprecated use SAMPLE_SHORTS_FALLBACK */
export const USE_SAMPLE_SHORTS = SAMPLE_SHORTS_FALLBACK

const SAMPLE_PREFIX = 'sample-short-'

type SampleDef = {
  slug: string
  videoUrl: string
  titleEn: string
  titleTe: string
  descriptionEn: string
  descriptionTe: string
}

const SAMPLE_DEFS: SampleDef[] = [
  {
    slug: `${SAMPLE_PREFIX}1`,
    videoUrl: shorts1,
    titleEn: 'Sample short 1',
    titleTe: 'నమూనా షార్ట్ 1',
    descriptionEn: 'Local preview clip for shorts layout.',
    descriptionTe: 'షార్ట్స్ లేఅుట్ కోసం స్థానిక ప్రివ్యూ క్లిప్.',
  },
  {
    slug: `${SAMPLE_PREFIX}2`,
    videoUrl: shorts2,
    titleEn: 'Sample short 2',
    titleTe: 'నమూనా షార్ట్ 2',
    descriptionEn: 'Vertical video player and card styling preview.',
    descriptionTe: 'నిలువు వీడియో ప్లేయర్ మరియు కార్డ్ స్టైలింగ్ ప్రివ్యూ.',
  },
  {
    slug: `${SAMPLE_PREFIX}3`,
    videoUrl: shorts3,
    titleEn: 'Sample short 3',
    titleTe: 'నమూనా షార్ట్ 3',
    descriptionEn: 'Home and shorts grid sample content.',
    descriptionTe: 'హోమ్ మరియు షార్ట్స్ గ్రిడ్ నమూనా కంటెంట్.',
  },
  {
    slug: `${SAMPLE_PREFIX}4`,
    videoUrl: shorts4,
    titleEn: 'Sample short 4',
    titleTe: 'నమూనా షార్ట్ 4',
    descriptionEn: 'Sample short 4 description.',
    descriptionTe: 'నమూనా షార్ట్ 4 వివరం.',
  },
  {
    slug: `${SAMPLE_PREFIX}5`,
    videoUrl: shorts5,
    titleEn: 'Sample short 5',
    titleTe: 'నమూనా షార్ట్ 5',
    descriptionEn: 'Sample short 5 description.',
    descriptionTe: 'నమూనా షార్ట్ 5 వివరం.',
  },
]

function buildSampleVideo(def: SampleDef, language: SupportedLanguage): VideoItem {
  const now = new Date().toISOString()
  return {
    id: def.slug,
    slug: def.slug,
    title: language === 'te' ? def.titleTe : def.titleEn,
    language,
    description: language === 'te' ? def.descriptionTe : def.descriptionEn,
    content: '',
    category_id: null,
    category_name: language === 'te' ? 'షార్ట్స్' : 'Shorts',
    video_url: def.videoUrl,
    youtube_url: null,
    thumbnail_url: null,
    status: 'published',
    is_short: true,
    short_allow_likes: true,
    short_allow_comments: true,
    short_allow_share: true,
    duration_seconds: null,
    sort_order: 0,
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    published_at: now,
    created_at: now,
    updated_at: now,
    tags: [],
  }
}

export function getSampleShortVideos(language: SupportedLanguage): VideoItem[] {
  return SAMPLE_DEFS.map((def) => buildSampleVideo(def, language))
}

export function getSampleShortCards(language: SupportedLanguage): PublicShortCardModel[] {
  return getSampleShortVideos(language).map((item) => mapApiVideoToShortCard(item, language))
}

export function getSampleVideoBySlug(
  slug: string,
  language: SupportedLanguage,
): VideoItem | null {
  const def = SAMPLE_DEFS.find((row) => row.slug === slug)
  if (!def) return null
  return buildSampleVideo(def, language)
}

export function isSampleShortSlug(slug: string): boolean {
  return slug.startsWith(SAMPLE_PREFIX)
}

export function getSampleRelatedVideos(
  excludeId: string,
  language: SupportedLanguage,
  limit = 3,
): PublicVideoCardModel[] {
  return getSampleShortVideos(language)
    .filter((row) => row.id !== excludeId)
    .slice(0, limit)
    .map((row) => mapApiVideoToCard(row, language))
}
