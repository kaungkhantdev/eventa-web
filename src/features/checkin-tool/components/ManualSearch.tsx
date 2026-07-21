import { useMemo, useState } from 'react'
import { IconInput, Paginator, usePagination } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ATTENDEES, type Attendee, type FeedInput } from '../data/checkin'

/* Manual fallback for when a ticket can't be scanned: a collapsible search over
   the attendee list, paginated, with an inline "Check in" action per row. */
export function ManualSearch({ onCheckIn }: { onCheckIn: (entry: FeedInput) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [attendees, setAttendees] = useState<Attendee[]>(() => ATTENDEES.map((a) => ({ ...a })))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return attendees.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.ticket.toLowerCase().includes(q),
    )
  }, [attendees, query])

  const pager = usePagination(filtered, 10)
  const total = filtered.length

  function checkInRow(a: Attendee) {
    onCheckIn({ name: a.name, ini: a.ini, ticket: a.ticket, badge: a.badge })
    setAttendees((prev) => prev.map((x) => (x === a ? { ...x, checkedIn: true } : x)))
  }

  return (
    <div className="border-t border-hair px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <i className="hgi-stroke hgi-search-01 text-[15px] text-muted" />
          Can't scan? Find attendee manually
        </span>
        <i
          className={cn(
            'hgi-stroke hgi-arrow-down-01 text-[16px] text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      <div className={cn('mt-3', !open && 'hidden')}>
        <IconInput
          icon="hgi-search-01"
          type="text"
          placeholder="Search name, email, or ticket ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            pager.setPage(1)
          }}
        />

        <div className="mb-1 mt-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Matching attendees
          </p>
          <p className="text-[11px] text-muted">
            {total} {total === 1 ? 'result' : 'results'}
          </p>
        </div>

        <div>
          {pager.slice.map((a) => (
            <div
              key={a.email}
              className="flex items-center gap-3 border-t border-line py-3 first:border-t-0"
            >
              <span className="avatar h-9 w-9 shrink-0 text-[11px]">{a.ini}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{a.name}</p>
                <p className="truncate text-[11px] text-muted">
                  {a.ticket} · {a.email}
                </p>
              </div>
              {a.checkedIn ? (
                <span className="badge badge-green shrink-0">
                  <i className="hgi-stroke hgi-tick-02 text-[12px]" />
                  Checked in
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => checkInRow(a)}
                  className="btn btn-primary btn-sm shrink-0"
                >
                  <i className="hgi-stroke hgi-tick-02 text-[14px]" />
                  Check in
                </button>
              )}
            </div>
          ))}
        </div>

        {total === 0 && (
          <div className="py-6 text-center text-[12px] text-muted">
            No attendees match your search.
          </div>
        )}

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="attendees"
        />
      </div>
    </div>
  )
}
