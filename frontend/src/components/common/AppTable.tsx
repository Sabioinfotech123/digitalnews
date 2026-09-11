import { Input, Space, Table, type TableProps } from 'antd'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import './AppTable.scss'

export type AppTableProps<T extends object> = Omit<TableProps<T>, 'title'> & {
  /** Page / section title above the table */
  title?: ReactNode
  /** Right-side actions (e.g. Create button) */
  toolbar?: ReactNode
  /** Optional filter row under the header */
  filters?: ReactNode
  /** Controlled search (leave undefined to hide search) */
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  /** Delay before notifying parent of search changes (ms). Default 400. */
  searchDebounceMs?: number
  /** Extra node next to search (chips, toggles, etc.) */
  searchExtra?: ReactNode
  className?: string
  cardClassName?: string
}

/**
 * One shared admin data table — customize via columns, toolbar, filters, search.
 * Built on Ant Design Table so you keep full TableProps (pagination, rowSelection, scroll, …).
 */
export function AppTable<T extends object>({
  title,
  toolbar,
  filters,
  searchValue = '',
  searchPlaceholder = 'Search…',
  onSearchChange,
  searchDebounceMs = 400,
  searchExtra,
  className,
  cardClassName,
  pagination,
  ...tableProps
}: AppTableProps<T>) {
  const showHeader = Boolean(title || toolbar)
  const showSearch = typeof onSearchChange === 'function'
  const showFilters = Boolean(filters) || showSearch

  const [draftSearch, setDraftSearch] = useState(searchValue)
  const skipDebounceRef = useRef(true)

  useEffect(() => {
    setDraftSearch(searchValue)
  }, [searchValue])

  useEffect(() => {
    if (!onSearchChange) return
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false
      return
    }
    if (draftSearch === searchValue) return

    // Clear applies immediately; typing waits for debounce
    if (draftSearch === '') {
      onSearchChange('')
      return
    }

    const timer = window.setTimeout(() => {
      onSearchChange(draftSearch)
    }, searchDebounceMs)

    return () => window.clearTimeout(timer)
  }, [draftSearch, onSearchChange, searchDebounceMs, searchValue])

  return (
    <div className={cn('app-table', className)}>
      {showHeader ? (
        <div className="app-table__header">
          <div className="app-table__title">{title}</div>
          {toolbar ? <div className="app-table__toolbar">{toolbar}</div> : null}
        </div>
      ) : null}

      {showFilters ? (
        <div className="app-table__filters">
          {showSearch ? (
            <Space wrap size="middle" className="app-table__search-row">
              <Input
                allowClear
                value={draftSearch}
                placeholder={searchPlaceholder}
                onChange={(e) => setDraftSearch(e.target.value)}
                prefix={<i className="fa-solid fa-magnifying-glass text-ink-muted" aria-hidden />}
                className="app-table__search"
              />
              {searchExtra}
            </Space>
          ) : null}
          {filters}
        </div>
      ) : null}

      <div className={cn('app-table__card', cardClassName)}>
        <Table<T>
          rowKey={tableProps.rowKey ?? 'id'}
          size="middle"
          {...tableProps}
          pagination={
            pagination === false
              ? false
              : {
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                  ...pagination,
                }
          }
        />
      </div>
    </div>
  )
}
