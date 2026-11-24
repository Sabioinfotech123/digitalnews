import type {
  AgentChatResponse,
  AgentControlAction,
  AgentStatusResponse,
  AgentSuggestion,
} from '@/types/agent'
import type { ContentLanguage } from '@/types/content'
import { apiClient } from '@/api/client'
import { APP_CONFIG } from '@/config/app'

export async function fetchAgentStatus(): Promise<AgentStatusResponse> {
  const { data } = await apiClient.get<AgentStatusResponse>('/admin/agent/status')
  return data
}

export async function fetchAgentSuggestions(): Promise<AgentSuggestion[]> {
  const { data } = await apiClient.get<AgentSuggestion[]>('/admin/agent/suggestions')
  return data
}

export async function controlAgent(action: AgentControlAction): Promise<AgentStatusResponse> {
  const { data } = await apiClient.post<AgentStatusResponse>('/admin/agent/control', { action })
  return data
}

export async function sendAgentChat(payload: {
  message: string
  suggestion_id?: string
  language?: ContentLanguage
}): Promise<AgentChatResponse> {
  const { data } = await apiClient.post<AgentChatResponse>('/admin/agent/chat', payload, {
    timeout: APP_CONFIG.agentChatTimeoutMs,
  })
  return data
}