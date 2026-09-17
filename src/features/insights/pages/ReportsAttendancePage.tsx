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
import type { AttendanceReportData } from '../insights.routes'

/**
 * Attendance and no-shows (US-RPT-09). Layout ported from the kit.
 *
 * A dash in this table is not a missing number: an event that has not started
 * has no attendance to report, which is a different fact from an event nobody
 * came to. The API draws that line and the page keeps it.
 */
export default function ReportsAttendancePage() {
  const data = useLoaderData() as AttendanceReportData
  const { set } = useFilters()
  const { tiles } = data

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Check-in and show-up rates across all events."
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
        <StatTile icon="hgi-user-check-01" label="Checked in" tile={tiles.checkedIn} />
        <StatTile
          icon="hgi-checkmark-badge-01"
          label="Attendance rate"
          tile={tiles.attendanceRate}
        />
        <StatTile icon="hgi-user-remove-01" label="No-shows" tile={tiles.noShows} />
        <StatTile icon="hgi-clock-01" label="On-time" tile={tiles.onTimeRate} />
      </div>

      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Attendance by event</h2>
            <p className="mt-0.5 text-[12px] text-muted">Checked-in vs registered</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Event</th>
                <th className="text-right">Registered</th>
                <th className="text-right">Checked-in</th>
                <th className="text-right">No-shows</th>
                <th className="text-right">Attendance %</th>
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
                    <td className="text-right text-ink tnum">{row.registered}</td>
                    <td className="text-right text-ink tnum">{row.checkedIn}</td>
                    <td className="text-right text-muted tnum">{row.noShows}</td>
                    <td className="text-right font-semibold text-ink tnum">
                      {row.attendanceRate}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[13px] text-muted">
                    No attendance for this selection.
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
