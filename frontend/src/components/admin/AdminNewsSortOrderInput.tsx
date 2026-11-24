import { InputNumber } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { NewsItem } from '@/types/content'

interface AdminNewsSortOrderInputProps {
  row: NewsItem
  value: number
  onSave: (row: NewsItem, nextOrder: number) => void
}

export function AdminNewsSortOrderInput({ row, value, onSave }: AdminNewsSortOrderInputProps) {
  const [draft, setDraft] = useState(value)
  const draftRef = useRef(value)
  const savingRef = useRef(false)

  useEffect(() => {
    draftRef.current = value
    setDraft(value)
  }, [value, row.id])

  const setNext = (raw: number | null) => {
    const next = Math.max(0, Math.floor(Number(raw ?? 0)))
    draftRef.current = next
    setDraft(next)
    return next
  }

  const commit = () => {
    if (savingRef.current) return
    const next = setNext(draftRef.current)
    if (next === (row.sort_order ?? 0)) return
    savingRef.current = true
    onSave(row, next)
    // Allow another save after parent reloads / value prop updates.
    window.setTimeout(() => {
      savingRef.current = false
    }, 400)
  }

  return (
    <InputNumber
      min={0}
      step={1}
      size="small"
      className="w-full"
      value={draft}
      onChange={(v) => {
        setNext(v)
      }}
      onBlur={commit}
      onPressEnter={commit}
    />
  )
}
