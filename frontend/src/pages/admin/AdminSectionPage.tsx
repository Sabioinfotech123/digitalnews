import { Typography } from 'antd'

const { Title, Paragraph } = Typography

interface AdminSectionPageProps {
  title: string
  description?: string
}

export function AdminSectionPage({ title, description }: AdminSectionPageProps) {
  return (
    <div className="rounded-lg border border-line bg-paper p-6 shadow-soft">
      <Title
        level={3}
        style={{
          marginTop: 0,
          fontFamily: 'var(--font-heading)',
          borderLeft: '4px solid var(--color-primary)',
          paddingLeft: 12,
        }}
      >
        {title}
      </Title>
      <Paragraph type="secondary" className="mb-0">
        {description ?? 'CRUD screens for this module will be built in the next content phases.'}
      </Paragraph>
    </div>
  )
}
