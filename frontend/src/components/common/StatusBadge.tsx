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
}

export function StatusBadge({ status }: { status: string }) {
  return <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
}
