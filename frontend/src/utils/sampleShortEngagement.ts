import type { VideoCommentItem, VideoEngagement } from '@/api/videoEngagement'

const LIKES_KEY = 'dn.sampleShort.likes'
const COMMENTS_KEY = 'dn.sampleShort.comments'

type StoredComments = Record<string, VideoCommentItem[]>

function readLikes(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

function writeLikes(data: Record<string, string[]>) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(data))
}

function readComments(): StoredComments {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY)
    return raw ? (JSON.parse(raw) as StoredComments) : {}
  } catch {
    return {}
  }
}

function writeComments(data: StoredComments) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(data))
}

export function sampleEngagement(slug: string, visitorKey: string): VideoEngagement {
  const likes = readLikes()[slug] ?? []
  const comments = readComments()[slug] ?? []
  return {
    like_count: likes.length,
    comment_count: comments.length,
    liked_by_visitor: likes.includes(visitorKey),
    allow_likes: true,
    allow_comments: true,
    allow_share: true,
  }
}

export function sampleToggleLike(slug: string, visitorKey: string): VideoEngagement {
  const all = readLikes()
  const list = [...(all[slug] ?? [])]
  const idx = list.indexOf(visitorKey)
  if (idx >= 0) list.splice(idx, 1)
  else list.push(visitorKey)
  all[slug] = list
  writeLikes(all)
  return sampleEngagement(slug, visitorKey)
}

export function sampleListComments(slug: string): VideoCommentItem[] {
  return readComments()[slug] ?? []
}

export function sampleAddComment(
  slug: string,
  visitorKey: string,
  authorName: string,
  body: string,
): VideoCommentItem {
  const all = readComments()
  const list = [...(all[slug] ?? [])]
  const item: VideoCommentItem = {
    id: `local-${Date.now()}`,
    author_name: authorName.trim(),
    body: body.trim(),
    created_at: new Date().toISOString(),
  }
  list.unshift(item)
  all[slug] = list
  writeComments(all)
  void visitorKey
  return item
}
