import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchPublicSiteSettings } from '@/api/settings'
import fallbackLogo from '@/assets/logo/logo.png'
import { DEFAULT_FAVICON, DEFAULT_PRIMARY_COLOR, type SiteSettings } from '@/types/settings'

type SiteSettingsContextValue = {
  settings: SiteSettings
  logoUrl: string
  faviconUrl: string
  primaryColor: string
  ready: boolean
  refreshSettings: () => Promise<void>
  applySettings: (next: SiteSettings) => void
}

const defaultSettings: SiteSettings = {
  id: 'local',
  logo_url: null,
  favicon_url: null,
  primary_color: DEFAULT_PRIMARY_COLOR,
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null)

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const raw = match[1]
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => clampChannel(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
}

function mixWith(hex: string, target: number, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex.toUpperCase()
  return rgbToHex(
    rgb.r + (target - rgb.r) * amount,
    rgb.g + (target - rgb.g) * amount,
    rgb.b + (target - rgb.b) * amount,
  )
}

export function applyPrimaryColorToDocument(color: string): void {
  const primary = (hexToRgb(color) ? color : DEFAULT_PRIMARY_COLOR).toUpperCase()
  const hover = mixWith(primary, 0, 0.18)
  const light = mixWith(primary, 255, 0.88)
  const rgb = hexToRgb(primary)
  const root = document.documentElement
  root.style.setProperty('--color-primary', primary)
  root.style.setProperty('--color-primary-hover', hover)
  root.style.setProperty('--color-primary-light', light)

  if (rgb) {
    root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
    // Relative luminance — pick readable text on primary backgrounds
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
    const onPrimary = luminance > 0.62 ? '#111111' : '#FFFFFF'
    root.style.setProperty('--color-on-primary', onPrimary)
  } else {
    root.style.setProperty('--color-on-primary', '#FFFFFF')
  }
}

function faviconTypeFromUrl(url: string): string | undefined {
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  if (path.endsWith('.ico')) return 'image/x-icon'
  if (path.endsWith('.svg')) return 'image/svg+xml'
  if (path.endsWith('.webp')) return 'image/webp'
  if (path.endsWith('.gif')) return 'image/gif'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

export function applyFaviconToDocument(url: string | null | undefined): void {
  const href = url?.trim() || DEFAULT_FAVICON
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  const type = faviconTypeFromUrl(href)
  if (type) link.type = type
  // Bust cache when swapping icons
  link.href = href.includes('?') ? href : `${href}?v=${encodeURIComponent(href.slice(-24))}`
}

function applySettingsToDocument(settings: SiteSettings): void {
  applyPrimaryColorToDocument(settings.primary_color || DEFAULT_PRIMARY_COLOR)
  applyFaviconToDocument(settings.favicon_url)
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [ready, setReady] = useState(false)

  const applySettings = (next: SiteSettings) => {
    setSettings(next)
    applySettingsToDocument(next)
  }

  const refreshSettings = async () => {
    try {
      const data = await fetchPublicSiteSettings()
      applySettings(data)
    } catch {
      applySettingsToDocument(defaultSettings)
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    void refreshSettings()
  }, [])

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      settings,
      logoUrl: settings.logo_url?.trim() || fallbackLogo,
      faviconUrl: settings.favicon_url?.trim() || DEFAULT_FAVICON,
      primaryColor: settings.primary_color || DEFAULT_PRIMARY_COLOR,
      ready,
      refreshSettings,
      applySettings,
    }),
    [settings, ready],
  )

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings(): SiteSettingsContextValue {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  }
  return ctx
}
