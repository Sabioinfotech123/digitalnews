import type { ReactNode } from 'react'

export type ConfirmModalApi = {
  confirm: (config: {
    title: ReactNode
    content?: ReactNode
    okText?: string
    okType?: 'danger' | 'primary' | 'dashed' | 'link' | 'text' | 'default'
    cancelText?: string
    centered?: boolean
    autoFocusButton?: 'ok' | 'cancel' | null
    onOk?: () => void | Promise<void>
  }) => void
}

export type ConfirmActionOptions = {
  modal: ConfirmModalApi
  title: string
  content?: string
  okText?: string
  okType?: 'danger' | 'primary' | 'dashed' | 'link' | 'text' | 'default'
  cancelText?: string
  onConfirm: () => void | Promise<void>
}

/** Centered confirmation modal (shared across app). */
export function confirmAction({
  modal,
  title,
  content,
  okText = 'Confirm',
  okType = 'primary',
  cancelText = 'Cancel',
  onConfirm,
}: ConfirmActionOptions) {
  modal.confirm({
    title,
    content,
    okText,
    okType,
    cancelText,
    centered: true,
    autoFocusButton: 'cancel',
    onOk: onConfirm,
  })
}
