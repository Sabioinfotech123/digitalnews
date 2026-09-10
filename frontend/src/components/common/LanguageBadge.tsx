import { Tag } from 'antd'

const LABELS: Record<string, string> = {
  en: 'EN',
  te: 'తెలుగు',
}

export function LanguageBadge({ language }: { language: string }) {
  return (
    <Tag color={language === 'te' ? 'volcano' : 'red'}>{LABELS[language] ?? language.toUpperCase()}</Tag>
  )
}
