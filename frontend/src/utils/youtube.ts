/** Extract a YouTube video id from common URL shapes, or null. */
export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const raw = url.trim()
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = parsed.searchParams.get('v')
      if (v) return v
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
        return parts[1] || null
      }
    }
  } catch {
    return null
  }

  return null
}

export function youtubeWatchUrl(url: string): string {
  const id = extractYoutubeId(url)
  return id ? `https://www.youtube.com/watch?v=${id}` : url.trim()
}
