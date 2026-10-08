import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SEARCH_DEBOUNCE_MS } from '@/lib/useFilters'
import type { AttendanceRow } from '../door.types'

/**
 * The kit's "Can't scan? Find attendee manually" fallback (US-REG-13).
 *
 * Collapsed by default, because at a working door the camera is the way in and
 * this is for the badge that will not read. Its search covers name, email and
 * ticket code — so a hardware scanner that types into it finds the row too,
 * which is how the kit intends a code to be looked up by hand.
 *
 * Its own fetcher against a resource route, so nothing is asked of the API
 * until somebody actually types: the station sits idle most of the evening,
 * and a search on every keystroke of an empty box is a request for nothing.
 */

/** The kit's page-size choices, verbatim. */
const PAGE_SIZES = [10, 20, 30, 50] as const
const DEFAULT_SIZE = 10

export function ManualSearch({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [size, setSize] = useState<number>(DEFAULT_SIZE)
  const [page, setPage] = useState(1)
  const results = useFetcher<{ rows: AttendanceRow[] }>()
  const admit = useFetcher()

  const load = results.load
  useEffect(() => {
    const query = term.trim()
    if (!eventId || !query) return
    const timer = setTimeout(
      () =>
        load(
          `/admin/check-in/search?eventId=${encodeURIComponent(eventId)}&q=${encodeURIComponent(query)}`,
        ),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [term, eventId, load])

  const all = term.trim() ? (results.data?.rows ?? []) : []
  const pages = Math.max(1, Math.ceil(all.length / size))
  const current = Math.min(page, pages)
  const rows = all.slice((current - 1) * size, current * size)
  const searching = term.trim() !== '' && results.state !== 'idle'

  return (
    <div className="border-t border-hair px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[13px] font-semibold text-ink">
          Can’t scan? Find attendee manually
        </span>
        <Icon
          name="hgi-arrow-down-01"
          size={16}
          className={cn('text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="mt-3">
          <div className="relative">
            <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
            <input
              type="text"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value)
                setPage(1)
              }}
              disabled={!eventId}
              aria-label="Find an attendee"
              placeholder="Search name, email, or ticket ID"
              className="input pl-9"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink">Matching attendees</p>
            <p className="text-[11px] text-muted">
              {searching ? 'Searching…' : all.length > 0 ? `${all.length} found` : ''}
            </p>
          </div>

          {rows.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted">
              {term.trim() && !searching
                ? 'No attendees match your search.'
                : 'Start typing to search.'}
            </p>
          ) : (
            <ul className="mt-1 divide-y divide-line">
              {rows.map((row) => (
                <li key={row.ticketId} className="flex items-center gap-3 py-2.5">
                  <span className="avatar h-8 w-8 text-[11px]">{row.initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{row.name}</p>
                    <p className="truncate text-[11.5px] text-muted">{row.ticketType}</p>
                  </div>
                  {row.checkedIn ? (
                    <span className="badge badge-green shrink-0">In at {row.time}</span>
                  ) : (
                    <admit.Form method="post" className="shrink-0">
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="ticketId" value={row.ticketId} />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={admit.state !== 'idle'}
                      >
                        <Icon name="hgi-tick-02" size={14} />
                        Check in
                      </button>
                    </admit.Form>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
            <p>
              {all.length > 0 &&
                `Showing ${(current - 1) * size + 1}–${Math.min(current * size, all.length)} of ${all.length}`}
            </p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5">
                Rows per page
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="select h-8 w-auto min-w-[3.75rem] py-0 pl-2.5 pr-7 text-[12px] font-medium text-ink"
                >
                  {PAGE_SIZES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                aria-label="Previous page"
                disabled={current <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Icon name="hgi-arrow-left-01" size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                aria-label="Next page"
                disabled={current >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                <span className="hidden sm:inline">Next</span>
                <Icon name="hgi-arrow-right-01" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
