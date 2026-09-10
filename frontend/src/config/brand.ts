export const BRAND = {
  name: 'NEWS',
  shortName: 'NEWS',
  tagline: 'Digital News Platform',
  logo: '/assets/logo-placeholder.svg',
  favicon: '/assets/favicon-placeholder.svg',
  /** Replace with real YouTube channel when finalized */
  youtubeChannelUrl: 'https://www.youtube.com/',
  /** Replace with embeddable live stream URL (YouTube Live / CDN) */
  liveStreamEmbedUrl: '',
  liveStreamPagePath: '/live',
} as const

export type BrandConfig = typeof BRAND
