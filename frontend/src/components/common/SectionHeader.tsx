import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface SectionHeaderProps {
  title: string
  moreLabel?: string
  moreTo?: string
  children?: ReactNode
  className?: string
}

export function SectionHeader({ title, moreLabel, moreTo, children, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-2',
        className,
      )}
    >
      <h2 className="m-0 font-heading text-lg font-bold tracking-tight text-ink">{title}</h2>
      <div className="flex items-center gap-3">
        {children}
        {moreLabel && moreTo ? (
          <Link
            to={moreTo}
            className="whitespace-nowrap font-ui text-sm font-medium text-primary hover:text-primary-hover"
          >
            {moreLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
