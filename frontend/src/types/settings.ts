export const DEFAULT_PRIMARY_COLOR = '#D71920'

export interface SiteSettings {
  id: string
  logo_url: string | null
  primary_color: string
}

export interface SiteSettingsPayload {
  logo_url?: string | null
  primary_color?: string
}
