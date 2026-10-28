const STORAGE_KEY = 'dn.visitorKey'

function randomKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

export function getVisitorKey(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing && existing.length >= 8) return existing
    const next = randomKey()
    localStorage.setItem(STORAGE_KEY, next)
    return next
  } catch {
    return randomKey()
  }
}
