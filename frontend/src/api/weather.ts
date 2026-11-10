export interface WeatherLocation {
  latitude: number
  longitude: number
  name: string
  fromDevice: boolean
  /** Picked by the visitor from search; device location must not override it. */
  manual?: boolean
}

export interface PlaceSearchResult {
  id: string
  name: string
  /** District / block / state / country, already joined for display. */
  details: string
  latitude: number
  longitude: number
}

export interface WeatherSnapshot {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  precipitation: number
  weatherCode: number
  isDay: boolean
  todayMax: number
  todayMin: number
  rainChance: number | null
  sunrise: string | null
  sunset: string | null
  days: WeatherDay[]
  fetchedAt: number
}

export interface WeatherDay {
  /** Local date `YYYY-MM-DD` at the forecast location. */
  date: string
  weatherCode: number
  max: number
  min: number
  rainChance: number | null
}

export const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  latitude: 17.385,
  longitude: 78.4867,
  name: 'Hyderabad',
  fromDevice: false,
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'
/** OpenStreetMap search by Komoot: free, no key, covers villages (Open-Meteo's list only has big places). */
const PLACE_SEARCH_URL = 'https://photon.komoot.io/api/'
const PREFERRED_COUNTRY = 'IN'

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    osm_id: number
    osm_type: string
    osm_key?: string
    name?: string
    city?: string
    district?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
  }
}

export async function searchPlaces(
  query: string,
  near?: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: '20', lang: 'en' })
  if (near) {
    params.set('lat', near.latitude.toFixed(3))
    params.set('lon', near.longitude.toFixed(3))
  }
  const res = await fetch(`${PLACE_SEARCH_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`Place search failed (${res.status})`)
  const data = (await res.json()) as { features?: PhotonFeature[] }

  const rank = (f: PhotonFeature) =>
    (f.properties.countrycode?.toUpperCase() === PREFERRED_COUNTRY ? 0 : 2) +
    (f.properties.osm_key === 'place' || f.properties.osm_key === 'boundary' ? 0 : 1)

  const seen = new Set<string>()
  const rows: PlaceSearchResult[] = []
  const features = (data.features ?? [])
    .map((feature, index) => ({ feature, index }))
    .sort((a, b) => rank(a.feature) - rank(b.feature) || a.index - b.index)

  for (const { feature } of features) {
    const p = feature.properties
    if (!p.name) continue
    const parts = [p.city, p.district, p.county, p.state, p.country].filter(
      (part, i, all): part is string => Boolean(part) && part !== p.name && all.indexOf(part) === i,
    )
    const details = parts.join(', ')
    const dedupeKey = `${p.name}|${details}`.toLowerCase()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    const [longitude, latitude] = feature.geometry.coordinates
    rows.push({ id: `${p.osm_type}${p.osm_id}`, name: p.name, details, latitude, longitude })
    if (rows.length >= 10) break
  }
  return rows
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    precipitation: number
    weather_code: number
    is_day: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max?: (number | null)[]
    sunrise: string[]
    sunset: string[]
  }
}

export async function fetchWeather(location: WeatherLocation): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`${FORECAST_URL}?${params}`)
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`)
  const data = (await res.json()) as OpenMeteoResponse
  const { current, daily } = data
  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    todayMax: daily.temperature_2m_max[0],
    todayMin: daily.temperature_2m_min[0],
    rainChance: daily.precipitation_probability_max?.[0] ?? null,
    sunrise: daily.sunrise[0] ?? null,
    sunset: daily.sunset[0] ?? null,
    days: daily.time.map((date, i) => ({
      date,
      weatherCode: daily.weather_code[i],
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      rainChance: daily.precipitation_probability_max?.[i] ?? null,
    })),
    fetchedAt: Date.now(),
  }
}

export async function reverseGeocodePlace(latitude: number, longitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'en',
  })
  try {
    const res = await fetch(`${REVERSE_GEOCODE_URL}?${params}`)
    if (!res.ok) return null
    const data = (await res.json()) as { city?: string; locality?: string; principalSubdivision?: string }
    return data.city || data.locality || data.principalSubdivision || null
  } catch {
    return null
  }
}
