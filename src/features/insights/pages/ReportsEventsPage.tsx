import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { PageFooter, NotificationBell, SignedInChip, Paginator, usePagination } from '@/components/ui'
import { cn } from '@/lib/cn'
import { baht, num } from '@/lib/format'
import { REPORTS_EVENTS, type ReportEventStatus } from '../data/reportsEvents'

/* Full searchable/paginated event list — admin/reports-events.html.
   REPORTS_EVENTS is pre-sorted by registrations (desc). */

const STATUS_BADGE: Record<ReportEventStatus, string> = {
  Upcoming: 'badge-blue',
  Completed: 'badge-gray',
  Live: 'badge-green',
}

export default function ReportsEventsPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return REPORTS_EVENTS.filter(
      (e) => (!query || e.name.toLowerCase().indexOf(query) !== -1) && (!status || e.status === status),
    )
  }, [q, status])

  const pager = usePagination(filtered)
  const { setPage } = pager

  const onSearch = (v: string) => {
    setQ(v)
    setPage(1)
  }
  const onStatus = (v: string) => {
    setStatus(v)
    setPage(1)
  }

  return (
    <>
      {/* header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => ctx?.openDrawer()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          title="Open menu"
        >
          <i className="hgi-stroke hgi-menu-01 text-[18px]" />
        </button>
        <Link
          to="/admin/reports"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-line hover:text-ink"
          title="Back to Reports"
        >
          <i className="hgi-stroke hgi-arrow-left-01 text-[20px]" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-bold tracking-tight">All events</h1>
          <p className="mt-0.5 truncate text-[12px] text-muted">
            Ranked by registrations · <span className="tnum">{num(REPORTS_EVENTS.length)}</span>{' '}
            events this period
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <NotificationBell />
          <SignedInChip />
        </div>
      </div>

      {/* search + status filter */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search events…"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <i className="hgi-stroke hgi-checkmark-badge-01 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value)}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
          >
            <option value="">All statuses</option>
            <option>Upcoming</option>
            <option>Live</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      {/* table */}
      <section className="card p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Event</th>
                <th>Registrations</th>
                <th>Revenue ฿</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((e) => (
                  <tr key={e.name}>
                    <td>
                      <div>
                        <Link
                          to="/admin/event-detail"
                          className="font-semibold text-ink hover:text-brand hover:underline"
                        >
                          {e.name}
                        </Link>
                        <p className="text-[11px] text-muted">{e.meta}</p>
                      </div>
                    </td>
                    <td className="text-ink tnum">{num(e.regs)}</td>
                    <td className="font-semibold text-ink tnum">{baht(e.rev)}</td>
                    <td className="text-muted tnum">{e.att ? e.att + '%' : '—'}</td>
                    <td>
                      <span className={cn('badge', STATUS_BADGE[e.status])}>{e.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="py-10 text-center text-[13px] text-muted">
                      No events match your filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pager.total > 0 && (
          <Paginator
            from={pager.from}
            to={pager.to}
            total={pager.total}
            page={pager.page}
            pageCount={pager.pageCount}
            size={pager.size}
            onPage={pager.setPage}
            onSize={pager.setSize}
            noun="events"
          />
        )}
      </section>

      <PageFooter />
    </>
  )
}
