import { confirmAction, type ConfirmModalApi } from '@/utils/confirmAction'

type ConfirmDeleteOptions = {
  modal: ConfirmModalApi
  title: string
  content?: string
  onConfirm: () => void | Promise<void>
}

/** Centered page modal for destructive delete confirmation. */
export function confirmDelete({ modal, title, content, onConfirm }: ConfirmDeleteOptions) {
  confirmAction({
    modal,
    title,
    content,
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onConfirm,
  })
}
