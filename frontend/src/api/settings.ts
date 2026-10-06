import { apiClient } from '@/api/client'
import type { SiteSettings, SiteSettingsPayload } from '@/types/settings'

export async function fetchPublicSiteSettings(): Promise<SiteSettings> {
  const { data } = await apiClient.get<SiteSettings>('/site-settings')
  return data
}

export async function fetchAdminSiteSettings(): Promise<SiteSettings> {
  const { data } = await apiClient.get<SiteSettings>('/admin/site-settings')
  return data
}

export async function updateSiteSettings(payload: SiteSettingsPayload): Promise<SiteSettings> {
  const { data } = await apiClient.patch<SiteSettings>('/admin/site-settings', payload)
  return data
}
