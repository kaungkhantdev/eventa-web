import { useLoaderData } from 'react-router'
import {
  Button,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  Paginator,
} from '@/components/ui'
import { useFilters } from '@/lib/useFilters'
import { ReportFilters } from '../components/ReportFilters'
import { StatTile } from '../components/StatTile'
import type { RegistrationsReportData } from '../insights.routes'

/**
 * Registrations by event and state (US-RPT-08). Layout ported from the kit.
 *
 * Every figure on screen is the API's, including the four tiles: they are summed
 * over the whole filter rather than the page, so they do not move as the reader
 * pages through the table beneath them.
 */
export default function ReportsRegistrationsPage() {
  const data = useLoaderData() as RegistrationsReportData
  const { set } = useFilters()
  const { tiles } = data

  return (
    <>
      <PageHeader
        title="Registrations"
        subtitle="Sign-ups and approvals across all events."
        actions={
          <>
            <Button variant="primary">
              <Icon name="hgi-download-01" size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      <ReportFilters events={data.events} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon="hgi-user-add-01" label="Total registrations" tile={tiles.total} />
        <StatTile icon="hgi-checkmark-badge-01" label="Confirmed" tile={tiles.confirmed} />
        <StatTile icon="hgi-clock-01" label="Pending" tile={tiles.pending} />
        <StatTile icon="hgi-cancel-circle" label="Cancelled" tile={tiles.cancelled} />
      </div>

      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Registrations by event</h2>
            <p className="mt-0.5 text-[12px] text-muted">Sign-ups &amp; status per event</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Event</th>
                <th className="text-right">Registrations</th>
                <th className="text-right">Confirmed</th>
                <th className="text-right">Pending</th>
                <th className="text-right">Waitlist</th>
                <th className="text-right">Cancelled</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-ink">{row.name}</p>
                        <p className="text-[11px] text-muted">{row.meta}</p>
                      </div>
                    </td>
                    <td className="text-right font-semibold text-ink tnum">{row.total}</td>
                    <td className="text-right text-ink tnum">{row.confirmed}</td>
                    <td className="text-right text-muted tnum">{row.pending}</td>
                    <td className="text-right text-muted tnum">{row.waitlisted}</td>
                    <td className="text-right text-muted tnum">{row.cancelled}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[13px] text-muted">
                    No registrations for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          {...data.window}
          noun="events"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </section>

      <PageFooter />
    </>
  )
}
