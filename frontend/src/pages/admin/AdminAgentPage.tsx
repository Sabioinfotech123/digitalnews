import { App, Badge, Input, List, Progress, Select, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { controlAgent, fetchAgentStatus, fetchAgentSuggestions, sendAgentChat } from '@/api/agent'
import { AdminNewsCreateModal } from '@/components/admin/AdminNewsCreateModal'
import { AppButton } from '@/components/common/AppButton'
import { useDocumentTitle } from '@/components/common/DocumentTitle'
import type {
  AgentChatResponse,
  AgentControlAction,
  AgentCredibility,
  AgentDraftFields,
  AgentRuntimeStatus,
  AgentStatusResponse,
  AgentSuggestion,
} from '@/types/agent'
import type { ContentLanguage } from '@/types/content'
import { BRAND } from '@/config/brand'
import { getApiErrorMessage } from '@/utils/apiError'
import { stripHtml } from '@/utils/publicNews'
import { cn } from '@/utils/cn'
import './AdminAgentPage.scss'

const { Text } = Typography

const AGENT_SHOW_ANSWER_DETAILS_KEY = 'aknews_agent_show_answer_details'
const AGENT_SHOW_MODAL_TITLE_KEY = 'aknews_agent_show_modal_title'
const AGENT_SHOW_MODEL_NAME_KEY = 'aknews_agent_show_model_name'
const AGENT_SHOW_STATUS_BAR_KEY = 'aknews_agent_show_status_bar'

type ChatLine =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'thinking'; id: string }
  | { kind: 'agent'; id: string; text: string; response?: AgentChatResponse; isError?: boolean }

function readBoolPref(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    return raw === '1' || raw === 'true'
  } catch {
    return defaultValue
  }
}

function writeBoolPref(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function articlePreview(html: string, maxLen = 720): string {
  const plain = stripHtml(html).replace(/\s+/g, ' ').trim()
  if (!plain) return ''
  if (plain.length <= maxLen) return plain
  return `${plain.slice(0, maxLen).trim()}…`
}

function newChatId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const STATUS_COLOR: Record<AgentRuntimeStatus, 'default' | 'success' | 'warning'> = {
  stopped: 'default',
  running: 'success',
  paused: 'warning',
}

const FEED_COLOR: Record<string, string> = {
  trending: 'volcano',
  latest: 'blue',
  viral: 'purple',
}

export function AdminAgentPage() {
  const { message } = App.useApp()
  const autoStarted = useRef(false)
  const [status, setStatus] = useState<AgentStatusResponse | null>(null)
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatLine[]>([])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState<ContentLanguage>('en')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [modalDraft, setModalDraft] = useState<AgentDraftFields | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [showAnswerDetails, setShowAnswerDetails] = useState(() =>
    readBoolPref(AGENT_SHOW_ANSWER_DETAILS_KEY, true),
  )
  const [showModalTitle, setShowModalTitle] = useState(() =>
    readBoolPref(AGENT_SHOW_MODAL_TITLE_KEY, true),
  )
  const [showModelName, setShowModelName] = useState(() =>
    readBoolPref(AGENT_SHOW_MODEL_NAME_KEY, false),
  )
  const [showStatusBar, setShowStatusBar] = useState(() =>
    readBoolPref(AGENT_SHOW_STATUS_BAR_KEY, false),
  )
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const togglePref = (key: string, value: boolean, set: (v: boolean) => void) => {
    set(value)
    writeBoolPref(key, value)
  }

  useDocumentTitle(`Agent | ${BRAND.name} CMS`)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat, sending])

  const refreshSuggestions = useCallback(async () => {
    const items = await fetchAgentSuggestions()
    setSuggestions(items)
  }, [])

  const runControl = async (action: AgentControlAction, lang: ContentLanguage = language) => {
    setLoading(true)
    try {
      const st = await controlAgent(action, lang)
      setStatus(st)
      await refreshSuggestions()
      message.success(`Agent ${action}`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Could not ${action} agent`))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const st = await fetchAgentStatus()
        if (!active) return
        setStatus(st)
        if (st.fetch_language) setLanguage(st.fetch_language)
        if (!autoStarted.current && st.status === 'stopped') {
          autoStarted.current = true
          const started = await controlAgent('start', st.fetch_language ?? language)
          if (!active) return
          setStatus(started)
          if (started.fetch_language) setLanguage(started.fetch_language)
        }
        const items = await fetchAgentSuggestions()
        if (active) setSuggestions(items)
      } catch (err) {
        if (active) message.error(getApiErrorMessage(err, 'Could not load agent'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [message])

  const submitChat = async (
    apiMessage: string,
    options?: {
      suggestionId?: string | null
      displayText?: string
    },
  ) => {
    const payload = apiMessage.trim()
    if (!payload) return
    const displayText = (options?.displayText ?? apiMessage).trim() || payload
    const thinkingId = newChatId()
    setSending(true)
    setChat((prev) => [
      ...prev,
      {
        kind: 'user',
        id: newChatId(),
        text: displayText,
      },
      { kind: 'thinking', id: thinkingId },
    ])
    setInput('')
    try {
      const response = await sendAgentChat({
        message: payload,
        suggestion_id: options?.suggestionId ?? undefined,
        language,
      })
      setChat((prev) => [
        ...prev.filter((line) => line.id !== thinkingId),
        {
          kind: 'agent',
          id: newChatId(),
          text: response.assistant_message,
          response,
        },
      ])
    } catch (err) {
      const detail = getApiErrorMessage(err, 'Agent could not respond')
      message.error(detail)
      setChat((prev) => [
        ...prev.filter((line) => line.id !== thinkingId),
        {
          kind: 'agent',
          id: newChatId(),
          text: detail,
          isError: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const onPickSuggestion = (item: AgentSuggestion) => {
    setSelectedId(item.id)
    const source = item.source_name || 'unknown'
    const note = `Prepare a CMS draft from this story. Source: ${source}`
    void submitChat(note, {
      suggestionId: item.id,
      displayText: item.title,
    })
  }

  const openDraftModal = (draft: AgentDraftFields) => {
    setModalDraft(draft)
    setCreateOpen(true)
  }

  const agentStatus = status?.status ?? 'stopped'

  return (
    <>
      <AdminNewsCreateModal
        open={createOpen}
        draft={modalDraft}
        showTitle={showModalTitle}
        onClose={() => {
          setCreateOpen(false)
          setModalDraft(null)
        }}
      />
      <div className="admin-agent">
      <div className="admin-agent__toolbar">
        <div>
          <h2 className="admin-agent__heading">News agent</h2>
          <Text type="secondary">Trending / latest headlines · OpenRouter multi-model</Text>
        </div>
        <Space wrap>
          <AppButton
            type="primary"
            icon={<i className="fa-solid fa-play" aria-hidden />}
            loading={loading}
            onClick={() => void runControl('start')}
            disabled={agentStatus === 'running'}
          >
            Start
          </AppButton>
          <AppButton
            icon={<i className="fa-solid fa-pause" aria-hidden />}
            loading={loading}
            onClick={() => void runControl('pause')}
            disabled={agentStatus !== 'running'}
          >
            Pause
          </AppButton>
          <AppButton
            icon={<i className="fa-solid fa-play" aria-hidden />}
            loading={loading}
            onClick={() => void runControl('resume')}
            disabled={agentStatus === 'running'}
          >
            Resume
          </AppButton>
          <AppButton
            danger
            icon={<i className="fa-solid fa-power-off" aria-hidden />}
            loading={loading}
            onClick={() => void runControl('stop')}
          >
            Stop
          </AppButton>
          <AppButton
            icon={<i className="fa-solid fa-rotate" aria-hidden />}
            loading={loading}
            onClick={() => void runControl('refetch')}
          >
            Refetch
          </AppButton>
          <Select
            value={language}
            style={{ width: 120 }}
            disabled={loading}
            onChange={(val) => {
              setLanguage(val)
              void runControl('refetch', val)
            }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'te', label: 'తెలుగు' },
            ]}
          />
          <AgentPrefToggle
            active={showAnswerDetails}
            onClick={() =>
              togglePref(AGENT_SHOW_ANSWER_DETAILS_KEY, !showAnswerDetails, setShowAnswerDetails)
            }
            icon="fa-solid fa-circle-info"
          >
            Answer details
          </AgentPrefToggle>
          <AgentPrefToggle
            active={showModalTitle}
            onClick={() => togglePref(AGENT_SHOW_MODAL_TITLE_KEY, !showModalTitle, setShowModalTitle)}
            icon="fa-solid fa-heading"
          >
            Form title
          </AgentPrefToggle>
          <AgentPrefToggle
            active={showModelName}
            onClick={() => togglePref(AGENT_SHOW_MODEL_NAME_KEY, !showModelName, setShowModelName)}
            icon="fa-solid fa-microchip"
          >
            Model name
          </AgentPrefToggle>
          <AgentPrefToggle
            active={showStatusBar}
            onClick={() => togglePref(AGENT_SHOW_STATUS_BAR_KEY, !showStatusBar, setShowStatusBar)}
            icon="fa-solid fa-signal"
          >
            Status bar
          </AgentPrefToggle>
        </Space>
      </div>

      {showStatusBar ? (
      <div className="admin-agent__status">
        <span>
          Status: <Badge status={STATUS_COLOR[agentStatus]} text={agentStatus} />
        </span>
        <span>Suggestions: {status?.suggestions_count ?? suggestions.length}</span>
        <span>OpenRouter: {status?.openrouter_configured ? 'ready' : 'set OPENROUTER_API_KEY'}</span>
        {status?.last_fetch_at ? (
          <span>Last fetch: {new Date(status.last_fetch_at).toLocaleString()}</span>
        ) : null}
        {status?.next_fetch_at && agentStatus === 'running' ? (
          <span>Next fetch: {new Date(status.next_fetch_at).toLocaleString()}</span>
        ) : null}
      </div>
      ) : null}

      <div className="admin-agent__body">
        <AgentSuggestionList suggestions={suggestions} selectedId={selectedId} onPick={onPickSuggestion} />
        <div className="admin-agent__chat">
          <div className="admin-agent__messages">
            {chat.length === 0 ? (
              <Text type="secondary">
                Pick a suggestion or type a headline. Each reply has Add to CMS at the top to open the full create
                form.
              </Text>
            ) : null}
            {chat.map((line) => (
              <AgentBubble
                key={line.id}
                line={line}
                showAnswerDetails={showAnswerDetails}
                showModelName={showModelName}
                onAddToCms={openDraftModal}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="admin-agent__composer">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a headline or instructions…"
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={(e) => {
                if (e.shiftKey) return
                e.preventDefault()
                void submitChat(input, { suggestionId: selectedId })
              }}
              disabled={sending}
            />
            <AppButton
              type="primary"
              loading={sending}
              onClick={() => void submitChat(input, { suggestionId: selectedId })}
            >
              Send
            </AppButton>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function AgentPrefToggle({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  icon?: string
}) {
  return (
    <AppButton
      type={active ? 'primary' : 'default'}
      className={cn('admin-agent__pref-btn', active && 'admin-agent__pref-btn--on')}
      icon={icon ? <i className={icon} aria-hidden /> : undefined}
      onClick={onClick}
    >
      {children}
    </AppButton>
  )
}

function AgentBubble({
  line,
  showAnswerDetails,
  showModelName,
  onAddToCms,
}: {
  line: ChatLine
  showAnswerDetails: boolean
  showModelName: boolean
  onAddToCms: (draft: AgentDraftFields) => void
}) {
  if (line.kind === 'user') {
    return (
      <div className="admin-agent__bubble admin-agent__bubble--user">
        <div className="font-medium">{line.text}</div>
      </div>
    )
  }
  if (line.kind === 'thinking') {
    return (
      <div className="admin-agent__bubble admin-agent__bubble--thinking" aria-live="polite">
        <Spin size="small" />
        <span>Drafting story</span>
        <span className="admin-agent__thinking-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>
    )
  }
  const cred = line.response?.credibility
  const draft = line.response?.draft
  return (
    <div
      className={`admin-agent__bubble admin-agent__bubble--agent${line.isError ? ' is-error' : ''}`}
    >
      {draft ? (
        <div className="admin-agent__bubble-actions">
          <AppButton
            type="primary"
            className="btn-soft-primary admin-agent__add-cms-btn"
            icon={<i className="fa-solid fa-plus" aria-hidden />}
            onClick={() => onAddToCms(draft)}
          >
            Add to CMS
          </AppButton>
        </div>
      ) : null}
      <div>{line.text}</div>
      {cred && showAnswerDetails ? (
        <div className="admin-agent__credibility">
          <Text strong className="block">
            {draft?.title || cred.title}
          </Text>
          {draft?.short_description ? (
            <Text type="secondary" className="admin-agent__answer-desc block mt-1">
              {stripHtml(draft.short_description)}
            </Text>
          ) : null}
          {draft?.content ? (
            <p className="admin-agent__answer-body">{articlePreview(draft.content)}</p>
          ) : null}
          <div className="mt-2">
            <Tag
              color={
                cred.verdict === 'likely_real' ? 'green' : cred.verdict === 'likely_fake' ? 'red' : 'gold'
              }
            >
              {cred.verdict.replace('_', ' ')}
            </Tag>
          </div>
          <CredibilityBar {...credibilityMeter(cred)} />
          <Text type="secondary" className="block text-xs mt-1">
            {cred.summary}
          </Text>
        </div>
      ) : null}
      {showModelName && line.response?.model_used ? (
        <Text type="secondary" className="block text-xs mt-2 admin-agent__model-name">
          Model: {line.response.model_used}
        </Text>
      ) : null}
    </div>
  )
}

function credibilityMeter(cred: AgentCredibility): {
  label: string
  percent: number
  status?: 'success' | 'exception' | 'normal'
} {
  if (cred.verdict === 'likely_real') {
    return {
      label: `Likely true ${cred.real_percent}%`,
      percent: cred.real_percent,
      status: 'success',
    }
  }
  if (cred.verdict === 'likely_fake') {
    return {
      label: `Likely fake ${cred.fake_percent}%`,
      percent: cred.fake_percent,
      status: 'exception',
    }
  }
  if (cred.real_percent >= cred.fake_percent) {
    return {
      label: `Uncertain — lean true ${cred.real_percent}%`,
      percent: cred.real_percent,
      status: 'normal',
    }
  }
  return {
    label: `Uncertain — lean fake ${cred.fake_percent}%`,
    percent: cred.fake_percent,
    status: 'normal',
  }
}

function CredibilityBar({
  label,
  percent,
  status = 'normal',
}: {
  label: string
  percent: number
  status?: 'success' | 'exception' | 'normal'
}) {
  return (
    <div className="mt-2">
      <Text className="text-xs">{label}</Text>
      <Progress percent={percent} size="small" status={status} showInfo={false} />
    </div>
  )
}

function AgentSuggestionList({
  suggestions,
  selectedId,
  onPick,
}: {
  suggestions: AgentSuggestion[]
  selectedId: string | null
  onPick: (item: AgentSuggestion) => void
}) {
  return (
    <div className="admin-agent__suggestions">
      <List
        header={<Text strong>Suggestions (source included)</Text>}
        dataSource={suggestions}
        locale={{ emptyText: 'Start or refetch to load headlines' }}
        renderItem={(item) => (
          <List.Item
            className={`admin-agent__suggestion-item${selectedId === item.id ? ' admin-agent__suggestion-item--active' : ''}`}
            onClick={() => onPick(item)}
          >
            <List.Item.Meta
              title={
                <Space wrap size={4}>
                  <Tag color={FEED_COLOR[item.feed] || 'default'}>{item.feed}</Tag>
                  <span>{item.title}</span>
                </Space>
              }
              description={
                <div className="text-xs text-slate-500">
                  <div>Source: {item.source_name || '—'}</div>
                  {item.published_at ? <div>{item.published_at}</div> : null}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}