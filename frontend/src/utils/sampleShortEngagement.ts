import type { CommentReaction, VideoCommentItem, VideoEngagement } from '@/api/videoEngagement'

const LIKES_KEY = 'dn.sampleShort.likes'
const COMMENTS_KEY = 'dn.sampleShort.comments'
const COMMENT_REACTIONS_KEY = 'dn.sampleShort.commentReactions'

type StoredComments = Record<string, VideoCommentItem[]>
type StoredReactions = Record<string, Record<string, CommentReaction>>

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

function readReactions(): StoredReactions {
  try {
    const raw = localStorage.getItem(COMMENT_REACTIONS_KEY)
    return raw ? (JSON.parse(raw) as StoredReactions) : {}
  } catch {
    return {}
  }
}

function writeReactions(data: StoredReactions) {
  localStorage.setItem(COMMENT_REACTIONS_KEY, JSON.stringify(data))
}

function enrichComment(item: VideoCommentItem, visitorKey: string): VideoCommentItem {
  const byVisitor = readReactions()[item.id] ?? {}
  const like_count = Object.values(byVisitor).filter((r) => r === 'like').length
  const dislike_count = Object.values(byVisitor).filter((r) => r === 'dislike').length
  const viewer_reaction = byVisitor[visitorKey] ?? null
  return { ...item, like_count, dislike_count, viewer_reaction }
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

export function sampleListComments(slug: string, visitorKey: string): VideoCommentItem[] {
  const list = readComments()[slug] ?? []
  return list.map((item) => enrichComment(item, visitorKey))
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
    like_count: 0,
    dislike_count: 0,
    viewer_reaction: null,
  }
  list.unshift(item)
  all[slug] = list
  writeComments(all)
  void visitorKey
  return item
}

export function sampleReactComment(
  slug: string,
  commentId: string,
  visitorKey: string,
  reaction: CommentReaction,
): VideoCommentItem {
  const comments = readComments()[slug] ?? []
  const item = comments.find((c) => c.id === commentId)
  if (!item) {
    throw new Error('Comment not found')
  }
  const all = readReactions()
  const byVisitor = { ...(all[commentId] ?? {}) }
  const existing = byVisitor[visitorKey]
  if (existing === reaction) {
    delete byVisitor[visitorKey]
  } else {
    byVisitor[visitorKey] = reaction
  }
  if (Object.keys(byVisitor).length === 0) {
    delete all[commentId]
  } else {
    all[commentId] = byVisitor
  }
  writeReactions(all)
  return enrichComment(item, visitorKey)
}
