import { Tag } from 'antd'

const STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  published: 'success',
  unpublished: 'warning',
  scheduled: 'processing',
  active: 'success',
  inactive: 'default',
  featured: 'red',
  latest: 'blue',
  trending: 'orange',
  more: 'default',
  breaking: 'magenta',
  local: 'cyan',
  likely_real: 'success',
  likely_fake: 'error',
  uncertain: 'warning',
  USER: 'blue',
  ADMIN: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  unpublished: 'Unpublished',
  scheduled: 'Scheduled',
  active: 'Active',
  inactive: 'Inactive',
  featured: 'Featured',
  latest: 'Latest',
  trending: 'Trending',
  more: 'More',
  breaking: 'Breaking',
  local: 'Local',
  likely_real: 'Likely real',
  likely_fake: 'Likely fake',
  uncertain: 'Uncertain',
  USER: 'User',
  ADMIN: 'Admin',
}

function formatStatusLabel(status: string): string {
  if (STATUS_LABEL[status]) return STATUS_LABEL[status]
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function StatusBadge({ status }: { status: string }) {
  return <Tag color={STATUS_COLOR[status] ?? 'default'}>{formatStatusLabel(status)}</Tag>
}
