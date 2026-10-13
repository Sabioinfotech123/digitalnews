import { App, Dropdown, type MenuProps } from 'antd'
import { useState, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useBookmarks } from '@/app/providers/BookmarksProvider'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { ShareModal } from '@/components/common/ShareModal'
import type { BookmarkContentType } from '@/types/bookmark'
import './CardActions.scss'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type CardActionsProps = {
  contentType: BookmarkContentType
  contentId: string
  title: string
  /** Site path of the detail page, e.g. `/news/my-slug` */
  path: string
}

export function CardActions({ contentType, contentId, title, path }: CardActionsProps) {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { isAuthenticated } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const navigate = useNavigate()
  const location = useLocation()
  const [shareOpen, setShareOpen] = useState(false)

  const canSave = UUID_RE.test(contentId)
  const saved = canSave && isBookmarked(contentType, contentId)
  const shareUrl = `${window.location.origin}${path}`

  const handleSave = async () => {
    if (!isAuthenticated) {
      message.info(t('bookmarks.loginRequired'))
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    try {
      const nowSaved = await toggleBookmark(contentType, contentId)
      message.success(nowSaved ? t('bookmarks.saved') : t('bookmarks.removed'))
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('bookmarks.saveFailed'))
    }
  }

  const items: MenuProps['items'] = [
    ...(canSave
      ? [
          {
            key: 'save',
            icon: <i className={saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} aria-hidden />,
            label: saved ? t('bookmarks.removeLabel') : t('bookmarks.saveLabel'),
          },
        ]
      : []),
    {
      key: 'share',
      icon: <i className="fa-solid fa-share-nodes" aria-hidden />,
      label: t('share.share'),
    },
  ]

  const onMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.preventDefault()
    domEvent.stopPropagation()
    if (key === 'save') void handleSave()
    if (key === 'share') setShareOpen(true)
  }

  // Cards are wrapped in a <Link>; keep clicks here (and in portaled menu/modal) from navigating.
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <span className="card-actions" onClick={stop}>
      <Dropdown
        menu={{ items, onClick: onMenuClick }}
        trigger={['click']}
        placement="bottomRight"
      >
        <button
          type="button"
          className="card-actions__trigger"
          aria-label={t('share.moreOptions')}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <i className="fa-solid fa-ellipsis-vertical" aria-hidden />
        </button>
      </Dropdown>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={title} />
    </span>
  )
}
