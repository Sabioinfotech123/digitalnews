import type { FormInstance } from 'antd'
import axios from 'axios'

type FastApiDetailItem = {
  loc?: Array<string | number>
  msg?: string
  message?: string
}

function detailToMessage(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const row = item as FastApiDetailItem
          return row.msg || row.message || null
        }
        return null
      })
      .filter(Boolean) as string[]
    if (parts.length) return parts.join('. ')
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const msg = (detail as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  return null
}

/** Human-readable message from Axios / FastAPI errors. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const fromDetail = detailToMessage(error.response?.data?.detail)
    if (fromDetail) return fromDetail
    const dataMsg = error.response?.data?.message
    if (typeof dataMsg === 'string' && dataMsg.trim()) return dataMsg
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Map FastAPI validation `detail` items onto Ant Design form fields when possible. */
export function applyApiFieldErrors(form: FormInstance, error: unknown): void {
  if (!axios.isAxiosError(error)) return
  const detail = error.response?.data?.detail
  if (!Array.isArray(detail)) return

  const fields = detail
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as FastApiDetailItem
      const loc = row.loc || []
      const name = loc.filter((part) => part !== 'body' && typeof part === 'string')
      const msg = row.msg || row.message
      if (!name.length || !msg) return null
      return { name, errors: [msg] }
    })
    .filter(Boolean) as Array<{ name: (string | number)[]; errors: string[] }>

  if (fields.length) form.setFields(fields)
}
