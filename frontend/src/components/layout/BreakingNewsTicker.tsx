import { useEffect, useState } from 'react'
import { fetchPublicNews } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import './BreakingNewsTicker.scss'

const PLACEHOLDER_ITEMS = [
  { en: 'Platform foundation is live — more stories coming soon', te: 'ప్లాట్‌ఫామ్ ఫౌండేషన్ సిద్ధం — మరిన్ని వార్తలు త్వరలో' },
  { en: 'English and Telugu news publishing supported', te: 'ఇంగ్లీష్ మరియు తెలుగు వార్తా ప్రచురణకు మద్దతు' },
]

export function BreakingNewsTicker() {
  const { t, contentLanguage } = useLanguage()
  const [items, setItems] = useState<string[]>(
    PLACEHOLDER_ITEMS.map((item) => (contentLanguage === 'te' ? item.te : item.en)),
  )

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchPublicNews({
          is_breaking: true,
          language: contentLanguage,
          page: 1,
          page_size: 8,
        })
        if (!active) return
        if (data.items.length > 0) {
          setItems(data.items.map((item) => item.title))
          return
        }
      } catch {
        // keep placeholders
      }
      if (!active) return
      setItems(PLACEHOLDER_ITEMS.map((item) => (contentLanguage === 'te' ? item.te : item.en)))
    })()
    return () => {
      active = false
    }
  }, [contentLanguage])

  return (
    <div className="breaking-ticker" role="region" aria-label={t('news.breakingNews')}>
      <div className="breaking-ticker__label">
        <i className="fa-solid fa-bolt" aria-hidden />
        <span>{t('news.breakingNews')}</span>
      </div>
      <div className="breaking-ticker__track">
        <div className="breaking-ticker__marquee">
          {[...items, ...items].map((text, index) => (
            <span key={`${text}-${index}`} className="breaking-ticker__item">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
