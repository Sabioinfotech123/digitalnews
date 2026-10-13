import { App, Modal } from 'antd'
import { useLanguage } from '@/app/providers/LanguageProvider'
import './ShareModal.scss'

type ShareModalProps = {
  open: boolean
  onClose: () => void
  url: string
  title: string
}

type ShareTarget = {
  key: string
  label: string
  icon: string
  tone: string
  href: string
}

export function ShareModal({ open, onClose, url, title }: ShareModalProps) {
  const { t } = useLanguage()
  const { message } = App.useApp()

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedText = encodeURIComponent(`${title} ${url}`)

  const targets: ShareTarget[] = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'fa-brands fa-whatsapp',
      tone: 'whatsapp',
      href: `https://wa.me/?text=${encodedText}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: 'fa-brands fa-facebook-f',
      tone: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      key: 'x',
      label: 'X',
      icon: 'fa-brands fa-x-twitter',
      tone: 'x',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: 'fa-brands fa-telegram',
      tone: 'telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: 'fa-brands fa-linkedin-in',
      tone: 'linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      key: 'email',
      label: t('share.email'),
      icon: 'fa-solid fa-envelope',
      tone: 'email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      message.success(t('share.copied'))
    } catch {
      message.error(t('share.copyFailed'))
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url })
      onClose()
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={420}
      rootClassName="share-sheet"
      destroyOnHidden
    >
      <div className="share-sheet__handle" aria-hidden />
      <h3 className="share-sheet__title">{t('share.title')}</h3>

      <div className="share-sheet__url">
        <span className="share-sheet__url-text" title={url}>
          {url}
        </span>
        <button
          type="button"
          className="share-sheet__copy"
          aria-label={t('share.copyLink')}
          onClick={() => void copyLink()}
        >
          <i className="fa-regular fa-copy" aria-hidden />
        </button>
      </div>

      <ul className="share-sheet__grid">
      <li>
          <button type="button" className="share-sheet__item" onClick={() => void copyLink()}>
            <span className="share-sheet__icon share-sheet__icon--copy" aria-hidden>
              <i className="fa-solid fa-link" />
            </span>
            <span className="share-sheet__label">{t('share.copyLink')}</span>
          </button>
        </li>
        {targets.map((target) => (
          <li key={target.key}>
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              className="share-sheet__item"
              onClick={onClose}
            >
              <span className={`share-sheet__icon share-sheet__icon--${target.tone}`} aria-hidden>
                <i className={target.icon} />
              </span>
              <span className="share-sheet__label">{target.label}</span>
            </a>
          </li>
        ))}
        
        {canNativeShare ? (
          <li>
            <button type="button" className="share-sheet__item" onClick={() => void nativeShare()}>
              <span className="share-sheet__icon share-sheet__icon--more" aria-hidden>
                <i className="fa-solid fa-ellipsis" />
              </span>
              <span className="share-sheet__label">{t('share.more')}</span>
            </button>
          </li>
        ) : null}
      </ul>

      <button type="button" className="share-sheet__cancel" onClick={onClose}>
        {t('share.cancel')}
      </button>
    </Modal>
  )
}
