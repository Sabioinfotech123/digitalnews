import { Popover } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_WEATHER_LOCATION,
  fetchWeather,
  reverseGeocodePlace,
  type WeatherLocation,
  type WeatherSnapshot,
} from '@/api/weather'
import { useLanguage } from '@/app/providers/LanguageProvider'
import type { TranslationKey } from '@/utils/i18n'
import { cn } from '@/utils/cn'
import { WeatherLocationModal } from './WeatherLocationModal'
import './HeaderWeather.scss'

const LOCATION_KEY = 'weather-location'
const CACHE_KEY = 'weather-cache'
const CACHE_TTL_MS = 15 * 60 * 1000
const REFRESH_MS = 30 * 60 * 1000

interface CachedWeather {
  key: string
  snapshot: WeatherSnapshot
}

function locationKey(loc: WeatherLocation) {
  return `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`
}

function readSavedLocation(): WeatherLocation {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return DEFAULT_WEATHER_LOCATION
    const parsed = JSON.parse(raw) as WeatherLocation
    if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') return parsed
  } catch {
    /* ignore */
  }
  return DEFAULT_WEATHER_LOCATION
}

function readCache(loc: WeatherLocation): WeatherSnapshot | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedWeather
    if (cached.key !== locationKey(loc)) return null
    if (Date.now() - cached.snapshot.fetchedAt > CACHE_TTL_MS) return null
    if (!Array.isArray(cached.snapshot.days)) return null
    return cached.snapshot
  } catch {
    return null
  }
}

function writeCache(loc: WeatherLocation, snapshot: WeatherSnapshot) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key: locationKey(loc), snapshot }))
  } catch {
    /* ignore */
  }
}

/** WMO weather codes used by Open-Meteo. */
function describeCode(code: number, isDay: boolean): { key: TranslationKey; icon: string } {
  if (code === 0) return { key: 'weather.clear', icon: isDay ? 'fa-sun' : 'fa-moon' }
  if (code === 1)
    return {
      key: 'weather.mainlyClear',
      icon: isDay ? 'fa-cloud-sun' : 'fa-cloud-moon',
    }
  if (code === 2)
    return {
      key: 'weather.partlyCloudy',
      icon: isDay ? 'fa-cloud-sun' : 'fa-cloud-moon',
    }
  if (code === 3) return { key: 'weather.overcast', icon: 'fa-cloud' }
  if (code === 45 || code === 48) return { key: 'weather.fog', icon: 'fa-smog' }
  if (code >= 51 && code <= 57) return { key: 'weather.drizzle', icon: 'fa-cloud-rain' }
  if (code >= 61 && code <= 67) return { key: 'weather.rain', icon: 'fa-cloud-showers-heavy' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { key: 'weather.snow', icon: 'fa-snowflake' }
  }
  if (code >= 80 && code <= 82) return { key: 'weather.showers', icon: 'fa-cloud-sun-rain' }
  if (code >= 95) return { key: 'weather.thunderstorm', icon: 'fa-cloud-bolt' }
  return { key: 'weather.partlyCloudy', icon: 'fa-cloud' }
}

/** Open-Meteo returns local wall-clock times like `2026-11-10T06:21`. */
function formatClock(value: string | null) {
  if (!value) return '—'
  const [hh, mm] = value.slice(11, 16).split(':').map(Number)
  if (Number.isNaN(hh) || Number.isNaN(mm)) return '—'
  const suffix = hh >= 12 ? 'PM' : 'AM'
  const hour = hh % 12 || 12
  return `${hour}:${String(mm).padStart(2, '0')} ${suffix}`
}

function formatWeekday(date: string, locale: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' })
}

function formatUpdated(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function HeaderWeather() {
  const { t, uiLanguage } = useLanguage()
  const dateLocale = uiLanguage === 'te' ? 'te-IN' : 'en-IN'
  const [location, setLocation] = useState<WeatherLocation>(readSavedLocation)
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(() =>
    readCache(readSavedLocation()),
  )
  const [failed, setFailed] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const saveLocation = useCallback((next: WeatherLocation) => {
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setLocation(next)
  }, [])

  const load = useCallback(async (loc: WeatherLocation, force = false) => {
    const cached = force ? null : readCache(loc)
    if (cached) {
      setSnapshot(cached)
      setFailed(false)
      return
    }
    try {
      const next = await fetchWeather(loc)
      writeCache(loc, next)
      setSnapshot(next)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    void load(location)
    const timer = window.setInterval(() => void load(location, true), REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [load, location])

  const locateDevice = useCallback(
    (onSuccess?: () => void) => {
      if (!('geolocation' in navigator)) {
        setLocationDenied(true)
        return
      }
      setLocating(true)
      setLocationDenied(false)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          const place = await reverseGeocodePlace(latitude, longitude)
          saveLocation({
            latitude,
            longitude,
            name: place ?? '',
            fromDevice: true,
          })
          setLocating(false)
          onSuccess?.()
        },
        () => {
          setLocating(false)
          setLocationDenied(true)
        },
        { maximumAge: 30 * 60 * 1000, timeout: 10000 },
      )
    },
    [saveLocation],
  )

  // Only auto-locate when the browser already has permission, so we never pop a prompt on page load.
  useEffect(() => {
    if (location.fromDevice || location.manual || !navigator.permissions?.query) return
    let active = true
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (active && status.state === 'granted') locateDevice()
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [location.fromDevice, location.manual, locateDevice])

  if (!snapshot) {
    return failed ? null : (
      <span className="header-weather header-weather--loading" aria-hidden>
        <i className="fa-solid fa-cloud" />
        <span className="header-weather__temp">--°</span>
      </span>
    )
  }

  const condition = describeCode(snapshot.weatherCode, snapshot.isDay)
  const placeName = location.name || t('weather.yourLocation')

  const details = (
    <div className="header-weather__panel">
      <div className="header-weather__panel-top">
        <i className={cn('fa-solid', condition.icon, 'header-weather__panel-icon')} aria-hidden />
        <div className="header-weather__panel-main">
          <div className="header-weather__panel-temp">{Math.round(snapshot.temperature)}°C</div>
          <div className="header-weather__panel-cond">{t(condition.key)}</div>
          <div className="header-weather__panel-place">
            <i className="fa-solid fa-location-dot" aria-hidden />
            {placeName}
          </div>
        </div>
      </div>

      <dl className="header-weather__grid">
        <div>
          <dt>{t('weather.feelsLike')}</dt>
          <dd>{Math.round(snapshot.feelsLike)}°C</dd>
        </div>
        <div>
          <dt>{t('weather.highLow')}</dt>
          <dd>
            {Math.round(snapshot.todayMax)}° / {Math.round(snapshot.todayMin)}°
          </dd>
        </div>
        <div>
          <dt>{t('weather.humidity')}</dt>
          <dd>{Math.round(snapshot.humidity)}%</dd>
        </div>
        <div>
          <dt>{t('weather.wind')}</dt>
          <dd>{Math.round(snapshot.windSpeed)} km/h</dd>
        </div>
        <div>
          <dt>{t('weather.rainChance')}</dt>
          <dd>{snapshot.rainChance == null ? '—' : `${snapshot.rainChance}%`}</dd>
        </div>
        <div>
          <dt>{t('weather.precipitation')}</dt>
          <dd>{snapshot.precipitation} mm</dd>
        </div>
        <div>
          <dt>{t('weather.sunrise')}</dt>
          <dd>{formatClock(snapshot.sunrise)}</dd>
        </div>
        <div>
          <dt>{t('weather.sunset')}</dt>
          <dd>{formatClock(snapshot.sunset)}</dd>
        </div>
      </dl>

      {snapshot.days.length > 1 ? (
        <div className="header-weather__week">
          <div className="header-weather__week-title">{t('weather.sevenDay')}</div>
          <ul className="header-weather__days">
            {snapshot.days.map((day, index) => {
              const dayCondition = describeCode(day.weatherCode, true)
              return (
                <li key={day.date} className="header-weather__day">
                  <span className="header-weather__day-name">
                    {index === 0 ? t('weather.today') : formatWeekday(day.date, dateLocale)}
                  </span>
                  <i
                    className={cn('fa-solid', dayCondition.icon, 'header-weather__day-icon')}
                    title={t(dayCondition.key)}
                    aria-label={t(dayCondition.key)}
                  />
                  <strong className="header-weather__day-max">{Math.round(day.max)}°</strong>
                  <span className="header-weather__day-min">{Math.round(day.min)}°</span>
                  <span className="header-weather__day-rain">
                    {day.rainChance ? (
                      <>
                        <i className="fa-solid fa-droplet" aria-hidden />
                        {day.rainChance}%
                      </>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="header-weather__panel-foot">
        <span>
          {t('weather.updated')} {formatUpdated(snapshot.fetchedAt)}
        </span>
        <button
          type="button"
          className="header-weather__locate"
          onClick={() => {
            setPopoverOpen(false)
            setModalOpen(true)
          }}
        >
          <i className="fa-solid fa-location-dot" aria-hidden />
          {t('weather.changeLocation')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Popover
        content={details}
        trigger={['hover', 'click']}
        placement="bottomRight"
        arrow={false}
        rootClassName="header-weather__popover"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      >
        <button
          type="button"
          className="header-weather"
          aria-label={`${t('weather.label')}: ${Math.round(snapshot.temperature)}°C, ${t(condition.key)}, ${placeName}`}
        >
          <i className={cn('fa-solid', condition.icon)} aria-hidden />
          <span className="header-weather__temp">{Math.round(snapshot.temperature)}°</span>
        </button>
      </Popover>
      <WeatherLocationModal
        open={modalOpen}
        current={location}
        locating={locating}
        locationDenied={locationDenied}
        onClose={() => setModalOpen(false)}
        onPick={(next) => {
          saveLocation(next)
          setModalOpen(false)
        }}
        onUseDevice={() => locateDevice(() => setModalOpen(false))}
      />
    </>
  )
}
