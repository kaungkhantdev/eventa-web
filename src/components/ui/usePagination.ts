import { useMemo, useState } from 'react'

/**
 * Client-side paging, for the screens that hold their whole list in memory.
 *
 * Kept out of `Paginator.tsx` so that file exports only a component: a module
 * mixing the two breaks fast refresh, and every edit to the paginator would
 * reset the page of whatever is using it.
 *
 * A screen paged by the API does NOT use this — its page lives in the URL and
 * the server decides what is on it. See `useFilters` and `pageWindow`.
 */
/** Slices `rows` for the current page and resets to page 1 whenever the row
 *  set changes size (i.e. a filter was applied). */
export function usePagination<T>(rows: T[], initialSize = 10) {
  const [size, setSize] = useState(initialSize)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * size

  const slice = useMemo(() => rows.slice(start, start + size), [rows, start, size])

  return {
    slice,
    page: current,
    setPage,
    size,
    setSize: (n: number) => {
      setSize(n)
      setPage(1)
    },
    total: rows.length,
    pageCount,
    from: rows.length === 0 ? 0 : start + 1,
    to: Math.min(start + size, rows.length),
    reset: () => setPage(1),
  }
}
