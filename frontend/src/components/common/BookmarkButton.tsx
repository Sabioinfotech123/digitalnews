import { App } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useBookmarks } from '@/app/providers/BookmarksProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { BookmarkContentType } from '@/types/bookmark'
import './BookmarkButton.scss'

type BookmarkButtonProps = {
  contentType: BookmarkContentType
  contentId: string
  className?: string
}

export function BookmarkButton({ contentType, contentId, className = '' }: BookmarkButtonProps) {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { isAuthenticated } = useAuth()
  const { isBookmarked, toggleBookmark, ready } = useBookmarks()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)

  const saved = ready && isBookmarked(contentType, contentId)

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setBusy(true)
    try {
      const nowSaved = await toggleBookmark(contentType, contentId)
      message.success(nowSaved ? t('bookmarks.saved') : t('bookmarks.removed'))
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('bookmarks.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`bookmark-btn${saved ? ' bookmark-btn--active' : ''} ${className}`.trim()}
      disabled={busy || (!ready && isAuthenticated)}
      aria-pressed={saved}
      aria-label={saved ? t('bookmarks.removeLabel') : t('bookmarks.saveLabel')}
      onClick={() => void handleClick()}
    >
      <i className={saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} aria-hidden />
      <span>{saved ? t('bookmarks.savedShort') : t('bookmarks.saveShort')}</span>
    </button>
  )
}
