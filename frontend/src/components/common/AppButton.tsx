import { Button, type ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type AppButtonProps = ButtonProps & {
  className?: string
  children?: ReactNode
}

/**
 * Shared button built on Ant Design + Tailwind brand utilities.
 */
export function AppButton({ className, type = 'default', ...props }: AppButtonProps) {
  return (
    <Button
      type={type}
      className={cn(
        'font-ui font-semibold',
        type === 'primary' && 'shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.3)]',
        className,
      )}
      {...props}
    />
  )
}
