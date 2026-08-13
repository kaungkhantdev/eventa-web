import type { PageMeta } from '@/lib/api'

/**
 * The rows-per-page choices, and the first of them is the default.
 *
 * Here rather than beside the paginator because the number is a request to the
 * API before it is a control on screen: a loader validating `?limit=` and the
 * select the organizer changes have to agree on the same list.
 */
export const PAGE_SIZES = [10, 20, 30, 50] as const

export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0]

/** Whether a page size came from the control rather than from the address bar. */
export function isPageSize(size: number): boolean {
  return (PAGE_SIZES as readonly number[]).includes(size)
}

/** The "Showing 1–10 of 48" line, derived from what the API reported. */
export interface PageWindow {
  from: number
  to: number
  total: number
  page: number
  pageCount: number
  size: number
}

/**
 * Turn a server page's numbers into the window a paginator shows.
 *
 * Derived from the API's `meta` rather than from the rows on screen: the two
 * would disagree the moment a filter is applied server-side, and the count the
 * organizer reads has to be the count the query actually matched.
 */
export function pageWindow(meta: PageMeta): PageWindow {
  const size = meta.limit || 0
  const start = (meta.page - 1) * size
  return {
    from: meta.total === 0 ? 0 : start + 1,
    to: Math.min(start + size, meta.total),
    total: meta.total,
    page: meta.page,
    pageCount: Math.max(1, meta.totalPages),
    size,
  }
}
