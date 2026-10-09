import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { addBookmark, fetchBookmarkIds, removeBookmark } from '@/api/bookmarks'
import { useAuth } from '@/app/providers/AuthProvider'
import type { BookmarkContentType } from '@/types/bookmark'
import { getApiErrorMessage } from '@/utils/apiError'

function bookmarkKey(contentType: BookmarkContentType, contentId: string): string {
  return `${contentType}:${contentId}`
}

interface BookmarksContextValue {
  ready: boolean
  isBookmarked: (contentType: BookmarkContentType, contentId: string) => boolean
  toggleBookmark: (contentType: BookmarkContentType, contentId: string) => Promise<boolean>
  refreshBookmarks: () => Promise<void>
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null)

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  const refreshBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setKeys(new Set())
      setReady(true)
      return
    }
    setReady(false)
    try {
      const items = await fetchBookmarkIds()
      setKeys(new Set(items.map((row) => bookmarkKey(row.content_type, row.content_id))))
    } catch {
      setKeys(new Set())
    } finally {
      setReady(true)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void refreshBookmarks()
  }, [refreshBookmarks])

  const isBookmarked = useCallback(
    (contentType: BookmarkContentType, contentId: string) =>
      keys.has(bookmarkKey(contentType, contentId)),
    [keys],
  )

  const toggleBookmark = useCallback(
    async (contentType: BookmarkContentType, contentId: string) => {
      const key = bookmarkKey(contentType, contentId)
      const wasSaved = keys.has(key)
      if (wasSaved) {
        await removeBookmark(contentType, contentId)
        setKeys((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        return false
      }
      try {
        await addBookmark(contentType, contentId)
        setKeys((prev) => new Set(prev).add(key))
        return true
      } catch (err) {
        throw new Error(getApiErrorMessage(err, 'Could not save bookmark'))
      }
    },
    [keys],
  )

  const value = useMemo(
    () => ({ ready, isBookmarked, toggleBookmark, refreshBookmarks }),
    [ready, isBookmarked, toggleBookmark, refreshBookmarks],
  )

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext)
  if (!ctx) throw new Error('useBookmarks must be used within BookmarksProvider')
  return ctx
}
