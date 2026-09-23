import { Input, Space, Table, Tooltip, type TableProps } from 'antd'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AppButton } from '@/components/common/AppButton'
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
  /** Bottom-left reload control */
  onRefresh?: () => void
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
  onRefresh,
  className,
  cardClassName,
  pagination,
  scroll,
  loading,
  ...tableProps
}: AppTableProps<T>) {
  const showHeader = Boolean(title || toolbar)
  const showSearch = typeof onSearchChange === 'function'
  const showFilters = Boolean(filters) || showSearch

  const [draftSearch, setDraftSearch] = useState(searchValue)
  const skipDebounceRef = useRef(true)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(360)

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

    if (draftSearch === '') {
      onSearchChange('')
      return
    }

    const timer = window.setTimeout(() => {
      onSearchChange(draftSearch)
    }, searchDebounceMs)

    return () => window.clearTimeout(timer)
  }, [draftSearch, onSearchChange, searchDebounceMs, searchValue])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    const update = () => {
      const paginationEl = el.querySelector('.ant-table-pagination') as HTMLElement | null
      const headerEl = el.querySelector('.ant-table-header') as HTMLElement | null
      const theadEl = el.querySelector('.ant-table-thead') as HTMLElement | null
      const paginationH = paginationEl?.offsetHeight ?? 64
      const headerH = headerEl?.offsetHeight || theadEl?.offsetHeight || 48
      const next = Math.max(180, el.clientHeight - paginationH - headerH - 8)
      setScrollY((prev) => (prev === next ? prev : next))
    }

    update()
    const frame = window.requestAnimationFrame(update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      window.cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [showFilters, pagination, tableProps.dataSource])

  const mergedScroll: TableProps<T>['scroll'] = {
    x: scroll?.x ?? 'max-content',
    y: scroll?.y ?? scrollY,
  }

  return (
    <div className={cn('app-table', className)}>
      {showHeader ? (
        <div className="app-table__header">
          <div className="app-table__title">{title}</div>
          {toolbar ? <div className="app-table__toolbar">{toolbar}</div> : null}
        </div>
      ) : null}

      <div className={cn('app-table__card', cardClassName)}>
        {showFilters ? (
          <div className="app-table__filters">
            {showSearch ? (
              <Space wrap size="middle" className="app-table__search-row">
                <Input
                  allowClear
                  size="large"
                  value={draftSearch}
                  placeholder={searchPlaceholder}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  prefix={<i className="fa-solid fa-magnifying-glass" aria-hidden />}
                  className="app-table__search"
                />
                {searchExtra}
              </Space>
            ) : null}
            {filters}
          </div>
        ) : null}

        <div
          className={cn('app-table__body', onRefresh && 'app-table__body--with-refresh')}
          ref={bodyRef}
        >
          {onRefresh ? (
            <div className="app-table__refresh">
              <Tooltip title="Refresh">
                <AppButton
                  type="text"
                  aria-label="Refresh"
                  className={cn(
                    'app-table__icon-btn',
                    'app-table__icon-btn--refresh',
                    loading && 'is-spinning',
                  )}
                  icon={<i className="fa-solid fa-arrows-rotate" aria-hidden />}
                  disabled={Boolean(loading)}
                  onClick={onRefresh}
                />
              </Tooltip>
            </div>
          ) : null}
          <Table<T>
            rowKey={tableProps.rowKey ?? 'id'}
            size="middle"
            loading={loading}
            {...tableProps}
            rootClassName={cn('app-table__grid', tableProps.rootClassName)}
            scroll={mergedScroll}
            pagination={
              pagination === false
                ? false
                : {
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    ...pagination,
                    pageSizeOptions: ['10', '20', '50'],
                  }
            }
          />
        </div>
      </div>
    </div>
  )
}
