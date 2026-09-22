import { App, ColorPicker, Form, Input, Typography } from 'antd'
import type { Color } from 'antd/es/color-picker'
import { useEffect, useState, type MouseEvent } from 'react'
import { fetchAdminSiteSettings, updateSiteSettings } from '@/api/settings'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import { AppButton } from '@/components/common/AppButton'
import { AppLoader } from '@/components/common/AppLoader'
import { MediaUploader } from '@/components/common/MediaUploader'
import fallbackLogo from '@/assets/logo/logo.png'
import { DEFAULT_PRIMARY_COLOR } from '@/types/settings'
import { getApiErrorMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'
import './AdminSettingsPage.scss'

const { Title, Paragraph, Text } = Typography

const PRESET_COLORS = [
  '#D71920',
  '#E11D48',
  // '#1D4ED8',
  // '#0F766E',
  // '#CA8A04',
  // '#7C2D12',
  // '#6D28D9',
  '#111827',
]

const HEX_RE = /^#[0-9A-Fa-f]{6}$/
const CUSTOM_COLORS_KEY = 'site-settings-custom-colors'
const PRESET_SET = new Set(PRESET_COLORS)

function readCustomColors(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_COLORS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is string => typeof item === 'string' && HEX_RE.test(item.toUpperCase()))
      .map((item) => item.toUpperCase())
      .filter((item) => !PRESET_SET.has(item))
  } catch {
    return []
  }
}

function rememberCustomColor(color: string): string[] {
  const next = color.toUpperCase()
  if (!HEX_RE.test(next) || PRESET_SET.has(next)) return readCustomColors()
  const existing = readCustomColors().filter((item) => item !== next)
  const updated = [next, ...existing].slice(0, 8)
  try {
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
  return updated
}

function removeCustomColor(color: string): string[] {
  const next = color.toUpperCase()
  const updated = readCustomColors().filter((item) => item !== next)
  try {
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
  return updated
}

export function AdminSettingsPage() {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const { applySettings } = useSiteSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR)
  const [hexDraft, setHexDraft] = useState(DEFAULT_PRIMARY_COLOR)
  const [customColors, setCustomColors] = useState<string[]>(() => readCustomColors())

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchAdminSiteSettings()
        if (!active) return
        const color = (data.primary_color || DEFAULT_PRIMARY_COLOR).toUpperCase()
        setLogoUrl(data.logo_url)
        setFaviconUrl(data.favicon_url)
        setPrimaryColor(color)
        setHexDraft(color)
        if (!PRESET_SET.has(color)) {
          setCustomColors(rememberCustomColor(color))
        }
      } catch (err) {
        if (!active) return
        message.error(getApiErrorMessage(err, 'Failed to load settings'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [message])

  const setColor = (value: string) => {
    const next = value.toUpperCase()
    setPrimaryColor(next)
    setHexDraft(next)
  }

  const handleColorChange = (color: Color) => {
    setColor(color.toHexString())
  }

  const handleRemoveCustomColor = (color: string, event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const updated = removeCustomColor(color)
    setCustomColors(updated)
    if (primaryColor === color.toUpperCase()) {
      setColor(DEFAULT_PRIMARY_COLOR)
    }
  }

  const normalizedHexDraft = hexDraft.trim().toUpperCase()
  const hexDraftValid = HEX_RE.test(normalizedHexDraft)
  const hexPending = hexDraftValid && normalizedHexDraft !== primaryColor

  const applyHexColor = () => {
    if (!hexDraftValid) {
      message.error('Enter a valid hex color like #D71920')
      setHexDraft(primaryColor)
      return
    }
    setColor(normalizedHexDraft)
  }

  const handleHexBlur = () => {
    if (!hexDraft.trim()) {
      setHexDraft(primaryColor)
      return
    }
    if (!hexDraftValid) {
      setHexDraft(primaryColor)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateSiteSettings({
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        primary_color: primaryColor,
      })
      applySettings(updated)
      const color = (updated.primary_color || DEFAULT_PRIMARY_COLOR).toUpperCase()
      setLogoUrl(updated.logo_url)
      setFaviconUrl(updated.favicon_url)
      setPrimaryColor(color)
      setHexDraft(color)
      if (!PRESET_SET.has(color)) {
        setCustomColors(rememberCustomColor(color))
      }
      message.success('Settings saved successfully')
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Could not save settings'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AppLoader tip="Loading settings…" />
  }

  const previewLogo = logoUrl?.trim() || fallbackLogo

  return (
    <div className="admin-settings news-form-page">
      <AppLoader fullscreen spinning={saving} tip="Saving…" />

      <header className="admin-settings__header">
        <div>
          <Title level={3} className="admin-settings__title">
            {t('admin.settings')}
          </Title>
          <Paragraph type="secondary" className="admin-settings__intro">
            Branding for the public site and admin. Save to apply everywhere.
          </Paragraph>
        </div>
        <AppButton
          type="primary"
          className="btn-soft-primary"
          loading={saving}
          onClick={() => void handleSave()}
        >
          Save settings
        </AppButton>
      </header>

      <div className="admin-settings__grid">
        <section className="admin-settings__panel">
          <div className="admin-settings__panel-head">
            <h2 className="admin-settings__panel-title">Website logo</h2>
            <p className="admin-settings__panel-desc">
              Shown in header, footer, and login screens. PNG with transparent background works best.
            </p>
          </div>
          <div className="admin-settings__logo-upload">
            <MediaUploader
              kind="image"
              folder="brand"
              label=""
              value={logoUrl}
              onChange={setLogoUrl}
            />
          </div>
        </section>

        <section className="admin-settings__panel">
          <div className="admin-settings__panel-head">
            <h2 className="admin-settings__panel-title">Favicon</h2>
            <p className="admin-settings__panel-desc">
              Small icon in the browser tab. Square PNG or ICO (32×32 or 16×16) works best.
            </p>
          </div>
          <div className="admin-settings__favicon-upload">
            <MediaUploader
              kind="image"
              folder="brand"
              label=""
              accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp,image/gif"
              value={faviconUrl}
              onChange={setFaviconUrl}
            />
          </div>
        </section>

        <section className="admin-settings__panel">
          <div className="admin-settings__panel-head">
            <h2 className="admin-settings__panel-title">Primary color</h2>
            <p className="admin-settings__panel-desc">
              Buttons, active menu, breaking ticker, and accents.
            </p>
          </div>

          <Form layout="vertical" className="admin-settings__color-form">
            <div className="admin-settings__color-row">
              <ColorPicker
                value={primaryColor}
                onChange={handleColorChange}
                disabledAlpha
                size="large"
                disabled
              />
              <Input
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value)}
                onBlur={handleHexBlur}
                onPressEnter={applyHexColor}
                maxLength={7}
                className="admin-settings__hex"
                aria-label="Primary color hex"
                readOnly
              />
              {hexPending ? (
                <AppButton type="default" className="admin-settings__hex-apply" onClick={applyHexColor}>
                  Apply
                </AppButton>
              ) : null}
            </div>

            <div className="admin-settings__presets" role="list" aria-label="Color presets">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="listitem"
                  className={cn(
                    'admin-settings__preset',
                    primaryColor === color && 'admin-settings__preset--active',
                  )}
                  style={{ background: color }}
                  aria-label={color}
                  aria-pressed={primaryColor === color}
                  onClick={() => setColor(color)}
                />
              ))}
              {customColors.map((color, index) => (
                <div key={`custom-${color}`} className="admin-settings__custom" role="listitem">
                  <button
                    type="button"
                    className={cn(
                      'admin-settings__preset',
                      'admin-settings__preset--custom',
                      primaryColor === color && 'admin-settings__preset--active',
                    )}
                    style={{ background: color }}
                    aria-label={`Custom color ${color}`}
                    aria-pressed={primaryColor === color}
                    title={color}
                    onClick={() => setColor(color)}
                  >
                    <span className="admin-settings__preset-badge">
                      {index === 0 ? 'New' : 'Custom'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="admin-settings__custom-remove"
                    aria-label={`Remove custom color ${color}`}
                    title="Remove"
                    onClick={(event) => handleRemoveCustomColor(color, event)}
                  >
                    <i className="fa-solid fa-xmark" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </Form>
        </section>

        <section className="admin-settings__panel admin-settings__panel--preview">
          <div className="admin-settings__panel-head">
            <h2 className="admin-settings__panel-title">Live preview</h2>
            <p className="admin-settings__panel-desc">How branding will look after you save.</p>
          </div>

          <div className="admin-settings__preview">
            <div className="admin-settings__preview-header">
              <img src={previewLogo} alt="" className="admin-settings__preview-logo" />
              <div className="admin-settings__preview-nav">
                <span
                  className="admin-settings__preview-pill"
                  style={{ background: primaryColor }}
                >
                  Home
                </span>
                <span>Videos</span>
                <span>News</span>
                <span>Blogs</span>
              </div>
              <span
                className="admin-settings__preview-live"
                style={{ background: primaryColor }}
              >
                Live TV
              </span>
            </div>
            <div className="admin-settings__preview-ticker">
              <span className="admin-settings__preview-ticker-label">
                <i className="fa-solid fa-bolt" aria-hidden /> Breaking news
              </span>
              <span
                className="admin-settings__preview-ticker-track"
                style={{ background: primaryColor }}
              >
                Sample headline scrolls here
              </span>
            </div>
            <div className="admin-settings__preview-body">
              <AppButton
                type="primary"
                style={{ background: primaryColor, borderColor: primaryColor }}
              >
                Sample button
              </AppButton>
              <Text type="secondary" className="admin-settings__preview-hex">
                {primaryColor}
              </Text>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
