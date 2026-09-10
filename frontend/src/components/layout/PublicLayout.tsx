import type { ReactNode } from 'react'
import { BreakingNewsTicker } from '@/components/layout/BreakingNewsTicker'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import './PublicLayout.scss'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <Header />
      <BreakingNewsTicker />
      <div className="public-layout__content">{children}</div>
      <Footer />
    </div>
  )
}
