import { Input, Modal } from 'antd'
import type { InputRef } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type PlaceSearchResult, type WeatherLocation } from '@/api/weather'
import { useLanguage } from '@/app/providers/LanguageProvider'

interface WeatherLocationModalProps {
  open: boolean
  current: WeatherLocation
  locating: boolean
  locationDenied: boolean
  onClose: () => void
  onPick: (location: WeatherLocation) => void
  onUseDevice: () => void
}

export function WeatherLocationModal({
  open,
  current,
  locating,
  locationDenied,
  onClose,
  onPick,
  onUseDevice,
}: WeatherLocationModalProps) {
  const { t } = useLanguage()
  const inputRef = useRef<InputRef>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState(false)
  const nearLat = current.latitude
  const nearLon = current.longitude

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setFailed(false)
      return
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      setFailed(false)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const rows = await searchPlaces(q, { latitude: nearLat, longitude: nearLon }, controller.signal)
        setResults(rows)
        setFailed(false)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setResults([])
        setFailed(true)
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, nearLat, nearLon])

  const hasQuery = query.trim().length >= 2

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={t('weather.changeLocation')}
      width={420}
      centered
      destroyOnHidden
      rootClassName="weather-location-modal"
    >
      <p className="weather-location-modal__current">
        <i className="fa-solid fa-location-dot" aria-hidden />
        {t('weather.currentLocation')}: <strong>{current.name || t('weather.yourLocation')}</strong>
      </p>

      <Input
        ref={inputRef}
        allowClear
        size="large"
        value={query}
        placeholder={t('weather.searchPlaceholder')}
        prefix={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
        onChange={(e) => setQuery(e.target.value)}
        onPressEnter={() => {
          if (results[0]) onPick(toLocation(results[0]))
        }}
        aria-label={t('weather.searchPlaceholder')}
      />

      <button
        type="button"
        className="weather-location-modal__device"
        onClick={onUseDevice}
        disabled={locating}
      >
        <i className="fa-solid fa-location-crosshairs" aria-hidden />
        {locating ? t('weather.locating') : t('weather.useMyLocation')}
      </button>
      {locationDenied ? (
        <p className="weather-location-modal__note">{t('weather.locationDenied')}</p>
      ) : null}

      <div className="weather-location-modal__results" role="listbox" aria-busy={searching}>
        {searching ? (
          <p className="weather-location-modal__hint">{t('weather.searching')}</p>
        ) : failed ? (
          <p className="weather-location-modal__hint">{t('weather.searchFailed')}</p>
        ) : hasQuery && !results.length ? (
          <>
            <p className="weather-location-modal__hint">{t('weather.noPlaces')}</p>
            <p className="weather-location-modal__hint">{t('weather.searchTip')}</p>
          </>
        ) : !hasQuery ? (
          <>
            <p className="weather-location-modal__hint">{t('weather.searchHint')}</p>
            <p className="weather-location-modal__hint">{t('weather.searchTip')}</p>
          </>
        ) : (
          results.map((place) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={false}
              className="weather-location-modal__result"
              onClick={() => onPick(toLocation(place))}
            >
              <i className="fa-solid fa-city" aria-hidden />
              <span className="weather-location-modal__result-text">
                <span className="weather-location-modal__result-name">{place.name}</span>
                {place.details ? (
                  <span className="weather-location-modal__result-meta">{place.details}</span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}

function toLocation(place: PlaceSearchResult): WeatherLocation {
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    fromDevice: false,
    manual: true,
  }
}
