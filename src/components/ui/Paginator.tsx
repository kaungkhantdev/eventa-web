import { PAGE_SIZES } from '@/lib/paging'
import { Icon } from './Icon'

/* Canonical paginator, ported from the static kit: a "Showing X–Y of Z"
   line, a rows-per-page select, and labelled Prev/Next buttons. */

export type PaginatorProps = {
  from: number
  to: number
  total: number
  page: number
  pageCount: number
  size: number
  onPage: (page: number) => void
  onSize: (size: number) => void
  /** Noun for the "of Z" label, e.g. "registrations". */
  noun?: string
}

export function Paginator({
  from,
  to,
  total,
  page,
  pageCount,
  size,
  onPage,
  onSize,
  noun = 'results',
}: PaginatorProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
      <p>
        Showing {from}–{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 whitespace-nowrap">
          Rows per page
          <select
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
            className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <Icon name="hgi-arrow-left-01" size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="hgi-arrow-right-01" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
