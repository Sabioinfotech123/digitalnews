import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'ak-news-zoom'
const MIN = 0.85
const MAX = 1.25
const STEP = 0.05
const DEFAULT = 1

type ZoomContextValue = {
  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  canZoomIn: boolean
  canZoomOut: boolean
}

const ZoomContext = createContext<ZoomContextValue | null>(null)

function readStoredZoom(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT
    const value = Number(raw)
    if (!Number.isFinite(value)) return DEFAULT
    return Math.min(MAX, Math.max(MIN, Math.round(value * 100) / 100))
  } catch {
    return DEFAULT
  }
}

function applyZoom(zoom: number) {
  const root = document.getElementById('root')
  if (root) root.style.zoom = String(zoom)
  else document.documentElement.style.zoom = String(zoom)
}

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(DEFAULT)

  useEffect(() => {
    const initial = readStoredZoom()
    setZoom(initial)
    applyZoom(initial)
  }, [])

  const setAndStore = useCallback((next: number) => {
    const clamped = Math.min(MAX, Math.max(MIN, Math.round(next * 100) / 100))
    setZoom(clamped)
    applyZoom(clamped)
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped))
    } catch {
      /* ignore */
    }
  }, [])

  const zoomIn = useCallback(() => setAndStore(zoom + STEP), [setAndStore, zoom])
  const zoomOut = useCallback(() => setAndStore(zoom - STEP), [setAndStore, zoom])
  const resetZoom = useCallback(() => setAndStore(DEFAULT), [setAndStore])

  const value = useMemo(
    () => ({
      zoom,
      zoomIn,
      zoomOut,
      resetZoom,
      canZoomIn: zoom < MAX - 0.001,
      canZoomOut: zoom > MIN + 0.001,
    }),
    [zoom, zoomIn, zoomOut, resetZoom],
  )

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>
}

export function useZoom() {
  const ctx = useContext(ZoomContext)
  if (!ctx) throw new Error('useZoom must be used within ZoomProvider')
  return ctx
}
