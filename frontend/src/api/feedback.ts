import { apiClient } from '@/api/client'
import type {
  FeedbackItem,
  FeedbackSubmitPayload,
  FeedbackSubmitResponse,
  FeedbackUpdatePayload,
  PaginatedFeedback,
} from '@/types/feedback'

export async function submitFeedback(payload: FeedbackSubmitPayload): Promise<FeedbackSubmitResponse> {
  const { data } = await apiClient.post<FeedbackSubmitResponse>('/feedback', payload)
  return data
}

export async function fetchAdminFeedback(params: {
  search?: string
  status?: string
  category?: string
  page?: number
  page_size?: number
}): Promise<PaginatedFeedback> {
  const { data } = await apiClient.get<PaginatedFeedback>('/admin/feedback', { params })
  return data
}

export async function updateFeedback(id: string, payload: FeedbackUpdatePayload): Promise<FeedbackItem> {
  const { data } = await apiClient.patch<FeedbackItem>(`/admin/feedback/${id}`, payload)
  return data
}

export async function deleteFeedback(id: string): Promise<void> {
  await apiClient.delete(`/admin/feedback/${id}`)
}
