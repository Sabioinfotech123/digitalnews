import { App, ConfigProvider } from 'antd'
import { useMemo, type ReactNode } from 'react'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { LanguageProvider } from '@/app/providers/LanguageProvider'
import {
  SiteSettingsProvider,
  useSiteSettings,
} from '@/app/providers/SiteSettingsProvider'
import { ZoomProvider } from '@/app/providers/ZoomProvider'
import { ZoomControls } from '@/components/common/ZoomControls'
import { DEFAULT_PRIMARY_COLOR } from '@/types/settings'

function hexToRgba(hex: string, alpha: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return `rgba(215, 25, 32, ${alpha})`
  const raw = match[1]
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function contrastOn(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return '#FFFFFF'
  const raw = match[1]
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#111111' : '#FFFFFF'
}

function ThemedApp({ children }: { children: ReactNode }) {
  const { primaryColor } = useSiteSettings()
  const color = primaryColor || DEFAULT_PRIMARY_COLOR
  const onPrimary = contrastOn(color)

  const antdTheme = useMemo(
    () => ({
      token: {
        colorPrimary: color,
        colorLink: color,
        colorLinkHover: color,
        colorInfo: color,
        colorTextLightSolid: onPrimary,
        colorTextBase: '#171717',
        colorBgBase: '#FFFFFF',
        colorBgLayout: '#F7F7F7',
        borderRadius: 8,
        fontFamily: "'Public Sans', sans-serif",
        controlOutline: hexToRgba(color, 0.2),
      },
      components: {
        Button: {
          primaryShadow: `0 2px 6px ${hexToRgba(color, 0.28)}`,
          primaryColor: onPrimary,
          defaultBorderColor: '#E5E7EB',
          fontWeight: 600,
        },
        Menu: {
          itemSelectedColor: onPrimary,
          itemSelectedBg: color,
          darkItemSelectedColor: onPrimary,
        },
        Form: {
          verticalLabelPadding: '0 0 2px',
          itemMarginBottom: 16,
        },
      },
    }),
    [color, onPrimary],
  )

  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <ZoomProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <ZoomControls />
            </AuthProvider>
          </LanguageProvider>
        </ZoomProvider>
      </App>
    </ConfigProvider>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SiteSettingsProvider>
      <ThemedApp>{children}</ThemedApp>
    </SiteSettingsProvider>
  )
}
