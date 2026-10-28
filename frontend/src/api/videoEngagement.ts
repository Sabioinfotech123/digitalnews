import { apiClient } from '@/api/client'
import { isSampleShortSlug } from '@/config/sampleShorts'
import {
  sampleAddComment,
  sampleEngagement,
  sampleListComments,
  sampleReactComment,
  sampleToggleLike,
} from '@/utils/sampleShortEngagement'
import { getVisitorKey } from '@/utils/visitorKey'

export interface VideoEngagement {
  like_count: number
  comment_count: number
  liked_by_visitor: boolean
  allow_likes: boolean
  allow_comments: boolean
  allow_share: boolean
}

export type CommentReaction = 'like' | 'dislike'

export interface VideoCommentItem {
  id: string
  author_name: string
  body: string
  created_at: string
  like_count?: number
  dislike_count?: number
  viewer_reaction?: CommentReaction | null
}

export async function fetchVideoEngagement(
  slug: string,
  language?: string,
): Promise<VideoEngagement> {
  const visitorKey = getVisitorKey()
  if (isSampleShortSlug(slug)) {
    return sampleEngagement(slug, visitorKey)
  }
  const { data } = await apiClient.get<VideoEngagement>(`/videos/${slug}/engagement`, {
    params: { language, visitor_key: visitorKey },
  })
  return data
}

export async function toggleVideoLike(slug: string, language?: string): Promise<VideoEngagement> {
  const visitorKey = getVisitorKey()
  if (isSampleShortSlug(slug)) {
    return sampleToggleLike(slug, visitorKey)
  }
  const { data } = await apiClient.post<VideoEngagement>(`/videos/${slug}/like`, {
    visitor_key: visitorKey,
  }, { params: language ? { language } : undefined })
  return data
}

export async function fetchVideoComments(
  slug: string,
  language?: string,
): Promise<VideoCommentItem[]> {
  const visitorKey = getVisitorKey()
  if (isSampleShortSlug(slug)) {
    return sampleListComments(slug, visitorKey)
  }
  const { data } = await apiClient.get<{ items: VideoCommentItem[] }>(`/videos/${slug}/comments`, {
    params: { ...(language ? { language } : {}), visitor_key: visitorKey },
  })
  return data.items
}

export async function postVideoComment(
  slug: string,
  authorName: string,
  body: string,
  language?: string,
): Promise<VideoCommentItem> {
  const visitorKey = getVisitorKey()
  if (isSampleShortSlug(slug)) {
    return sampleAddComment(slug, visitorKey, authorName, body)
  }
  const { data } = await apiClient.post<VideoCommentItem>(
    `/videos/${slug}/comments`,
    {
      visitor_key: visitorKey,
      author_name: authorName,
      body,
    },
    { params: language ? { language } : undefined },
  )
  return data
}

export async function fetchAdminVideoComments(videoId: string): Promise<VideoCommentItem[]> {
  const { data } = await apiClient.get<{ items: VideoCommentItem[] }>(
    `/admin/videos/${videoId}/comments`,
  )
  return data.items
}

export async function deleteAdminVideoComment(commentId: string): Promise<void> {
  await apiClient.delete(`/admin/video-comments/${commentId}`)
}

export async function reactVideoComment(
  slug: string,
  commentId: string,
  reaction: CommentReaction,
): Promise<VideoCommentItem> {
  const visitorKey = getVisitorKey()
  if (isSampleShortSlug(slug)) {
    return sampleReactComment(slug, commentId, visitorKey, reaction)
  }
  const { data } = await apiClient.post<VideoCommentItem>(`/video-comments/${commentId}/react`, {
    visitor_key: visitorKey,
    reaction,
  })
  return data
}
