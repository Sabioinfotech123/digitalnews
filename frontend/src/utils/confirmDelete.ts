import type { ReactNode } from 'react'

type ConfirmDeleteOptions = {
  modal: {
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
  title: string
  content?: string
  onConfirm: () => void | Promise<void>
}

/** Centered page modal for destructive delete confirmation. */
export function confirmDelete({ modal, title, content, onConfirm }: ConfirmDeleteOptions) {
  modal.confirm({
    title,
    content,
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    centered: true,
    autoFocusButton: 'cancel',
    onOk: onConfirm,
  })
}
