import { fetchPublicVideos } from '@/api/content'
import type { SupportedLanguage } from '@/config/app'
import { getSampleShortCards, getSampleShortVideos, SAMPLE_SHORTS_FALLBACK } from '@/config/sampleShorts'
import type { VideoItem } from '@/types/content'
import { mapApiVideoToShortCard, type PublicShortCardModel } from '@/utils/publicVideo'

export type LoadPublicShortsResult = {
  items: VideoItem[]
  total: number
  usingSamples: boolean
}

export async function loadPublicShortVideos(
  language: SupportedLanguage,
  options?: { page?: number; page_size?: number; allowSampleFallback?: boolean },
): Promise<LoadPublicShortsResult> {
  const page = options?.page ?? 1
  const page_size = options?.page_size ?? 50
  const allowFallback = options?.allowSampleFallback ?? page === 1

  try {
    const data = await fetchPublicVideos({
      page,
      page_size,
      language,
      is_short: true,
    })
    if (data.items.length > 0) {
      return { items: data.items, total: data.total, usingSamples: false }
    }
  } catch {
    /* try fallback below */
  }

  if (allowFallback && SAMPLE_SHORTS_FALLBACK) {
    const samples = getSampleShortVideos(language)
    return { items: samples, total: samples.length, usingSamples: true }
  }

  return { items: [], total: 0, usingSamples: false }
}

export async function loadPublicShortCards(
  language: SupportedLanguage,
  options?: { page?: number; page_size?: number; allowSampleFallback?: boolean },
): Promise<{ items: PublicShortCardModel[]; total: number; usingSamples: boolean }> {
  const result = await loadPublicShortVideos(language, options)
  return {
    items: result.usingSamples
      ? getSampleShortCards(language)
      : result.items.map((item) => mapApiVideoToShortCard(item, language)),
    total: result.total,
    usingSamples: result.usingSamples,
  }
}
