import { App, Select } from 'antd'
import type { SelectProps } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchCategories } from '@/api/content'
import { useLanguage } from '@/app/providers/LanguageProvider'
import { AppButton } from '@/components/common/AppButton'
import type { Category } from '@/types/content'
import { cn } from '@/utils/cn'
import './CategoryFormSelect.scss'

const CATEGORY_CREATE_URL = '/admin/categories?create=1'

export interface CategoryFormSelectProps extends Omit<SelectProps, 'options' | 'loading'> {
  onCategoriesLoaded?: (categories: Category[]) => void
}

export function CategoryFormSelect({
  className,
  disabled,
  onCategoriesLoaded,
  dropdownRender,
  ...rest
}: CategoryFormSelectProps) {
  const { t } = useLanguage()
  const { message } = App.useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const onLoadedRef = useRef(onCategoriesLoaded)
  onLoadedRef.current = onCategoriesLoaded

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchCategories()
      setCategories(rows)
      onLoadedRef.current?.(rows)
      return rows
    } catch {
      message.error(t('admin.categoryLoadFailed'))
      return null
    } finally {
      setLoading(false)
    }
  }, [message, t])

  useEffect(() => {
    void load()
  }, [load])

  const handleRefresh = async () => {
    const rows = await load()
    if (rows) message.success(t('admin.categoryRefreshDone'))
  }

  const openAddCategory = () => {
    window.open(CATEGORY_CREATE_URL, '_blank', 'noopener,noreferrer')
  }

  const options = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  )

  return (
    <Select
      {...rest}
      className={cn('category-form-select', className)}
      disabled={disabled || loading}
      loading={loading}
      showSearch
      optionFilterProp="label"
      options={options}
      placeholder={rest.placeholder ?? t('admin.categorySelectPlaceholder')}
      dropdownRender={(menu) => (
        <>
          {typeof dropdownRender === 'function' ? dropdownRender(menu) : menu}
          <div
            className="category-form-select__dropdown-foot"
            onMouseDown={(e) => e.preventDefault()}
          >
            <AppButton
              type="text"
              size="small"
              className="category-form-select__dropdown-btn"
              icon={<i className="fa-solid fa-rotate-right" aria-hidden />}
              onClick={() => void handleRefresh()}
            >
              {t('admin.categoryRefresh')}
            </AppButton>
            <AppButton
              type="link"
              size="small"
              className="category-form-select__dropdown-btn"
              icon={<i className="fa-solid fa-plus" aria-hidden />}
              onClick={openAddCategory}
            >
              {t('admin.categoryAdd')}
            </AppButton>
          </div>
        </>
      )}
    />
  )
}