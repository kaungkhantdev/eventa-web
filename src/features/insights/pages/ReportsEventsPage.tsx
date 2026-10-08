import { Link, useLoaderData, useOutletContext } from 'react-router'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import {
  Badge,
  ExportMenu,
  NotificationBell,
  PageFooter,
  Paginator,
  SignedInChip,
} from '@/components/ui'
import { num } from '@/lib/format'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { ReportEmptyRow } from '../components/ReportEmptyRow'
import { REPORT_DOWNLOADS } from '../insights.exports'
import type { EventsReportData } from '../insights.routes'

/**
 * Events ranked by registrations (US-RPT-04). Layout ported from the kit.
 *
 * The badge is the API's answer, not this page's: `events.status` stops being
 * maintained once an event is published, so the stage is worked out from the
 * clock server-side. A cancelled event gets its own badge rather than being
 * folded into "Completed", which would read as one that simply finished.
 */
export default function ReportsEventsPage() {
  const data = useLoaderData() as EventsReportData
  const ctx = useOutletContext<AdminOutletContext | null>()
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  return (
    <>
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
            Ranked by registrations · <span className="tnum">{num(data.window.total)}</span> events
            this period
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <ExportMenu downloads={REPORT_DOWNLOADS.events} query={data.exportQuery} />
          <NotificationBell />
          <SignedInChip />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search events…"
            aria-label="Search events"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <i className="hgi-stroke hgi-checkmark-badge-01 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={params.get('status') ?? ''}
            onChange={(e) => set({ status: e.target.value })}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
            aria-label="Filter by stage"
          >
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

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
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <Link
                          to={row.href}
                          className="font-semibold text-ink hover:text-brand hover:underline"
                        >
                          {row.name}
                        </Link>
                        <p className="text-[11px] text-muted">{row.meta}</p>
                      </div>
                    </td>
                    <td className="text-ink tnum">{row.registrations}</td>
                    <td className="font-semibold text-ink tnum">{row.revenue}</td>
                    <td className="text-muted tnum">{row.attendanceRate}</td>
                    <td>
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <ReportEmptyRow
                  colSpan={5}
                  noun="events"
                  reason={emptyReason}
                  onClear={clear}
                >
                  No event matches the current search and stage. Try a different spelling, or
                  set the stage back to all.
                </ReportEmptyRow>
              )}
            </tbody>
          </table>
        </div>
        {data.window.total > 0 && (
          <Paginator
            {...data.window}
            noun="events"
            onPage={(page) => set({ page })}
            onSize={(size) => set({ limit: size, page: null })}
          />
        )}
      </section>

      <PageFooter />
    </>
  )
}
