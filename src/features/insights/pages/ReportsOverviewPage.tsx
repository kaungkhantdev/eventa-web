import { Link, useLoaderData } from 'react-router'
import {
  AreaChart,
  Badge,
  DonutChart,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  PanelEmptyPreview,
  PillTabs,
  type PillTabItem,
} from '@/components/ui'
import { bahtCompact } from '@/lib/format'
import { useFilters } from '@/lib/useFilters'
import { StatTile } from '../components/StatTile'
import type { OverviewData } from '../insights.routes'
import type { OverviewRange } from '../insights.types'

/**
 * Workspace health at a glance (US-RPT-01/03/04). Layout ported from the kit.
 *
 * The range switches the WHOLE screen, not just the chart: every figure here
 * describes one window, resolved once by the API, so the revenue tile and the
 * chart's headline cannot disagree about what "this year" meant.
 *
 * The kit's "Sales by channel" panel is deliberately absent. No source, channel
 * or UTM column exists anywhere in the schema, so it could only ever have been
 * invented — it needs capture at checkout before it can be reported on.
 */

const NO_REVENUE = 'No revenue in this period.'
const NOTHING_CLEARED = 'Paid registrations show up here as soon as the first one clears.'

const RANGE_TABS: PillTabItem<OverviewRange>[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: 'Year' },
]

export default function ReportsOverviewPage() {
  const data = useLoaderData() as OverviewData
  const { set } = useFilters()
  const { tiles } = data

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Insights across all your events."
        actions={<HeaderUser />}
      />

      {/* The kit put export buttons beside these tabs. An export belongs to a
          REPORT, not to a dashboard — each report page below has its own, and
          three buttons that did nothing were worse than none. */}
      <div className="mb-4">
        <PillTabs
          items={RANGE_TABS}
          value={data.range}
          onChange={(range) => set({ range })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile icon="hgi-wallet-01" label="Revenue" {...tiles.revenue} />
        <StatTile icon="hgi-user-add-01" label="Registrations" {...tiles.registrations} />
        <StatTile
          icon="hgi-checkmark-badge-01"
          label="Attendance rate"
          {...tiles.attendance}
        />
        <StatTile icon="hgi-ticket-01" label="Avg ticket" {...tiles.averageTicket} />
        <StatTile
          icon="hgi-delivery-return-01"
          label="Refund rate"
          wide
          {...tiles.refundRate}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <section className="card p-4 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">Revenue trend</h2>
              {data.revenue ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[24px] font-extrabold tracking-tight tnum">
                    {data.revenue.total}
                  </span>
                  <span
                    className={
                      data.revenue.delta.tone === 'good'
                        ? 'flex items-center gap-0.5 text-[13px] font-semibold text-brand'
                        : data.revenue.delta.tone === 'bad'
                          ? 'flex items-center gap-0.5 text-[13px] font-semibold text-red-500'
                          : 'flex items-center gap-0.5 text-[13px] font-semibold text-muted'
                    }
                  >
                    {data.revenue.delta.direction && (
                      <Icon
                        name={
                          data.revenue.delta.direction === 'up'
                            ? 'hgi-arrow-up-right-01'
                            : 'hgi-arrow-down-right-01'
                        }
                        size={13}
                      />
                    )}
                    {data.revenue.delta.text}
                  </span>
                  <span className="text-[12px] text-muted">vs previous period</span>
                </div>
              ) : (
                <p className="mt-1 text-[12px] text-muted">
                  Revenue is only shown to members with finance access.
                </p>
              )}
            </div>
          </div>
          {data.revenue &&
            (data.revenue.earned ? (
              <div className="mt-2">
                <AreaChart
                  labels={data.revenue.labels}
                  values={data.revenue.values}
                  format={(value) => bahtCompact(value)}
                  ariaLabel="Revenue trend"
                />
              </div>
            ) : (
              /* A period with no sales still comes back as a full series of
                 zeroes, which draws a flat line along the axis and reads as a
                 chart that failed rather than a period that earned nothing. */
              <PanelEmptyPreview preview="chart" description={NOTHING_CLEARED}>
                {NO_REVENUE}
              </PanelEmptyPreview>
            ))}
        </section>

        <section className="card p-4 xl:col-span-1">
          <h2 className="text-[15px] font-bold tracking-tight">
            Registrations by Ticket Type
          </h2>
          <p className="mt-0.5 text-[12px] text-muted">Share of total registrations</p>
          {data.mix.length ? (
            <>
              <div className="mt-2 flex justify-center">
                <DonutChart
                  data={data.mix.map((slice) => ({
                    value: slice.percent,
                    color: slice.color,
                  }))}
                  centerLabel={data.mixTotal}
                  centerSub="total registrations"
                  ariaLabel="Registrations by ticket type"
                />
              </div>
              <div className="mt-4 space-y-3">
                {data.mix.map((slice) => (
                  <div key={slice.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded"
                        style={{ background: slice.color }}
                      />
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold text-ink">{slice.name}</p>
                        <p className="text-[11px] text-muted tnum">
                          {slice.seats} registrations
                        </p>
                      </div>
                    </div>
                    <span className="text-[15px] font-bold tnum">{slice.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <PanelEmptyPreview
              preview="ring"
              description="Once tickets sell, this shows which types people chose."
            >
              Nothing sold yet.
            </PanelEmptyPreview>
          )}
        </section>
      </div>

      <section className="card mt-3 p-4">
        <h2 className="text-[15px] font-bold tracking-tight">Registrations by event</h2>
        <p className="mt-0.5 text-[12px] text-muted">
          Top {data.bars.length} events, share of total sign-ups
        </p>
        {data.bars.length ? (
          <div className="mt-4 space-y-3.5">
            {data.bars.map((bar) => (
              <div key={bar.id} className="flex items-center gap-3">
                <p className="w-36 shrink-0 truncate text-[13px] font-medium text-ink sm:w-44">
                  {bar.name}
                </p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${bar.width}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[13px] font-semibold tnum">
                  {bar.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <PanelEmptyPreview
            preview="bars"
            description="Widen the range, or check back once registrations start coming in."
          >
            No sign-ups in this period.
          </PanelEmptyPreview>
        )}
      </section>

      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Top events</h2>
            <p className="mt-0.5 text-[12px] text-muted">Ranked by registrations this period</p>
          </div>
          <Link
            to="/admin/reports-events"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
          >
            View all
            <Icon name="hgi-arrow-right-01" size={13} />
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
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
              {data.topEvents.length ? (
                data.topEvents.map((row) => (
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
                <tr>
                  <td colSpan={5}>
                    <PanelEmptyPreview
                      preview="table"
                      description="A report describes what has already happened. Widen the range, or start from your events."
                      action={{
                        label: 'See your events',
                        to: '/admin/events',
                        icon: 'hgi-calendar-03',
                      }}
                    >
                      No events in this period.
                    </PanelEmptyPreview>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PageFooter />
    </>
  )
}
