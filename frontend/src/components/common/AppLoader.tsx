import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import './AppLoader.scss'

export interface AppLoaderProps {
  spinning?: boolean
  tip?: string
  /** Cover the whole viewport (form submit, page transition) */
  fullscreen?: boolean
  /** Wrap children and show overlay on top of them */
  children?: ReactNode
  className?: string
  size?: 'small' | 'default' | 'large'
}

/**
 * Shared loading plugin (Ant Design Spin).
 * - fullscreen: page-level overlay
 * - with children: section/form overlay
 * - tip only: inline spinner
 */
export function AppLoader({
  spinning = true,
  tip = 'Loading…',
  fullscreen = false,
  children,
  className,
  size = 'large',
}: AppLoaderProps) {
  if (fullscreen) {
    if (!spinning) return null
    return (
      <div className={cn('app-loader app-loader--fullscreen', className)} role="status" aria-live="polite">
        <div className="app-loader__panel">
          <Spin size={size} />
          {tip ? <p className="app-loader__tip">{tip}</p> : null}
        </div>
      </div>
    )
  }

  if (children !== undefined) {
    return (
      <Spin spinning={spinning} tip={tip} size={size} className={cn('app-loader', className)}>
        <div className={cn(spinning && 'app-loader__content--busy')}>{children}</div>
      </Spin>
    )
  }

  if (!spinning) return null
  return (
    <div className={cn('app-loader app-loader--inline', className)} role="status">
      <div className="app-loader__panel">
        <Spin size={size} />
        {tip ? <p className="app-loader__tip">{tip}</p> : null}
      </div>
    </div>
  )
}
