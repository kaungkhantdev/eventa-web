import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { Icon } from '@/components/ui'
import { SEARCH_DEBOUNCE_MS } from '@/lib/useFilters'
import type { AttendanceRow } from '../door.types'

/**
 * Finding somebody when the code will not read (US-REG-13).
 *
 * Its own fetcher against a resource route, so nothing is asked of the API
 * until somebody actually types — the station sits idle most of the evening,
 * and a search on every keystroke of an empty box is a request for nothing.
 */
export function ManualSearch({ eventId }: { eventId: string }) {
  const [term, setTerm] = useState('')
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

  const rows = term.trim() ? (results.data?.rows ?? []) : []

  return (
    <div className="card mt-4 p-5">
      <h2 className="text-[15px] font-bold tracking-tight">Find by name</h2>
      <p className="mt-0.5 text-[12.5px] text-muted">
        When a badge will not scan, look them up and let them in by hand.
      </p>

      <div className="relative mt-3">
        <i className="hgi-stroke hgi-search-01 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={!eventId}
          aria-label="Find an attendee"
          placeholder="Name or email…"
          className="input h-11 w-full pl-9"
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">
          {term.trim() && results.state === 'idle' ? 'Nobody by that name.' : 'Start typing to search.'}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
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
    </div>
  )
}
