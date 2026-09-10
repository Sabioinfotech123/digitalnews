import { App, ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { LanguageProvider } from '@/app/providers/LanguageProvider'

const antdTheme = {
  token: {
    colorPrimary: '#D71920',
    colorLink: '#D71920',
    colorLinkHover: '#B5141A',
    colorInfo: '#D71920',
    colorTextBase: '#171717',
    colorBgBase: '#FFFFFF',
    colorBgLayout: '#F7F7F7',
    borderRadius: 8,
    fontFamily: "'Public Sans', sans-serif",
    controlOutline: 'rgba(215, 25, 32, 0.2)',
  },
  components: {
    Button: {
      primaryShadow: '0 2px 6px rgba(215, 25, 32, 0.28)',
      defaultBorderColor: '#E5E7EB',
      fontWeight: 600,
    },
    Menu: {
      itemSelectedColor: '#D71920',
      itemSelectedBg: '#FDE8E9',
    },
  },
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </App>
    </ConfigProvider>
  )
}
