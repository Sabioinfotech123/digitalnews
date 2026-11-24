import type { AgentDraftFields, AgentNewsPrefill } from '@/types/agent'

export const AGENT_PREFILL_STORAGE_KEY = 'aknews_agent_news_draft'

export function saveAgentPrefill(draft: AgentDraftFields): void {
  const payload: AgentNewsPrefill = {
    title: draft.title,
    slug: draft.slug,
    short_description: draft.short_description,
    content: draft.content,
    news_type: draft.news_type,
    language: draft.language,
    image_url: draft.image_url,
    seo_title: draft.seo_title,
    seo_description: draft.seo_description,
    status: 'draft',
  }
  sessionStorage.setItem(AGENT_PREFILL_STORAGE_KEY, JSON.stringify(payload))
}

export function consumeAgentPrefill(): AgentNewsPrefill | null {
  const raw = sessionStorage.getItem(AGENT_PREFILL_STORAGE_KEY)
  if (!raw) return null
  sessionStorage.removeItem(AGENT_PREFILL_STORAGE_KEY)
  try {
    const parsed = JSON.parse(raw) as AgentNewsPrefill
    if (!parsed?.title) return null
    return parsed
  } catch {
    return null
  }
}