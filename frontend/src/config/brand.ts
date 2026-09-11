export const BRAND = {
  name: 'AK News',
  shortName: 'AK News',
  tagline: 'Digital News Platform',
  logo: '/assets/logo-placeholder.svg',
  favicon: '/assets/favicon.png',
  /** Replace with real YouTube channel when finalized */
  youtubeChannelUrl: 'https://www.youtube.com/',
  /** Replace with embeddable live stream URL (YouTube Live / CDN) */
  liveStreamEmbedUrl: '',
  liveStreamPagePath: '/live',
} as const

export type BrandConfig = typeof BRAND
