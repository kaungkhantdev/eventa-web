import { useState } from 'react'
import { Link } from 'react-router'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  PillTabs,
  Button,
  Badge,
  Icon,
  AreaChart,
  DonutChart,
  type BadgeTone,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { REPORTS_EVENTS, type ReportEventStatus } from '../data/reportsEvents'
import {
  RANGE_TABS,
  REVENUE_DATASETS,
  STAT_CARDS,
  TICKET_TYPES,
  REGISTRATIONS_BY_EVENT,
  SALES_BY_CHANNEL,
  type RtRange,
} from '../data/reportsOverview'

const STATUS_TONE: Record<ReportEventStatus, BadgeTone> = {
  Upcoming: 'blue',
  Completed: 'gray',
  Live: 'green',
}

const nf = (n: number) => n.toLocaleString('en-US')

const RANGE_ITEMS: PillTabItem<RtRange>[] = RANGE_TABS

export default function ReportsOverviewPage() {
  const [range, setRange] = useState<RtRange>('year')
  const rt = REVENUE_DATASETS[range]
  const topEvents = REPORTS_EVENTS.slice(0, 6)

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Insights across all your events."
        actions={<HeaderUser />}
      />

      {/* date range (left) + export actions (right) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PillTabs items={RANGE_ITEMS} value={range} onChange={setRange} />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-[11px] text-muted">Export:</span>
          <Button variant="ghost">
            <Icon name="hgi-file-01" size={16} />
            CSV
          </Button>
          <Button variant="ghost">
            <Icon name="hgi-file-01" size={16} />
            Excel
          </Button>
          <Button variant="ghost">
            <Icon name="hgi-file-01" size={16} />
            PDF
          </Button>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className={cn('card p-3.5', c.wide && 'sm:col-span-2 xl:col-span-1')}>
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <Icon name={c.icon} size={16} />
              {c.label}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-[22px] font-bold tracking-tight tnum">{c.value}</p>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-[12px] font-semibold',
                  c.positive ? 'text-brand' : 'text-red-500',
                )}
              >
                <Icon name={c.down ? 'hgi-arrow-down-right-01' : 'hgi-arrow-up-right-01'} size={13} />
                {c.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* revenue trend + donut row */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <section className="card p-4 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">Revenue trend</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[24px] font-extrabold tracking-tight tnum">{rt.value}</span>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[13px] font-semibold',
                    rt.up ? 'text-brand' : 'text-red-500',
                  )}
                >
                  <Icon
                    name={rt.up ? 'hgi-arrow-up-right-01' : 'hgi-arrow-down-right-01'}
                    size={13}
                  />
                  {rt.delta}
                </span>
                <span className="text-[12px] text-muted">vs previous period</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <AreaChart
              labels={rt.labels}
              values={rt.values}
              max={rt.max}
              prefix="฿"
              suffix="k"
              ariaLabel="Revenue trend"
            />
          </div>
        </section>

        <section className="card p-4 xl:col-span-1">
          <h2 className="text-[15px] font-bold tracking-tight">Registrations by Ticket Type</h2>
          <p className="mt-0.5 text-[12px] text-muted">Share of total registrations</p>
          <div className="mt-2 flex justify-center">
            <DonutChart
              data={TICKET_TYPES.map((t) => ({ value: t.pct, color: t.color }))}
              centerLabel="1,340"
              centerSub="total registrations"
              ariaLabel="Registrations by ticket type"
            />
          </div>
          <div className="mt-4 space-y-3">
            {TICKET_TYPES.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded" style={{ background: t.color }} />
                  <div className="leading-tight">
                    <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                    <p className="text-[11px] text-muted tnum">{t.regs} registrations</p>
                  </div>
                </div>
                <span className="text-[15px] font-bold tnum">{t.pct}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* registrations by event + sales by channel row */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-[15px] font-bold tracking-tight">Registrations by event</h2>
          <p className="mt-0.5 text-[12px] text-muted">Top 6 events, share of total sign-ups</p>
          <div className="mt-4 space-y-3.5">
            {REGISTRATIONS_BY_EVENT.map((e) => (
              <div key={e.name} className="flex items-center gap-3">
                <p className="w-36 shrink-0 truncate text-[13px] font-medium text-ink sm:w-44">
                  {e.name}
                </p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${e.width}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[13px] font-semibold tnum">
                  {e.regs}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-[15px] font-bold tracking-tight">Sales by channel</h2>
          <p className="mt-0.5 text-[12px] text-muted">Where registrations are coming from</p>
          <div className="mt-4 space-y-3.5">
            {SALES_BY_CHANNEL.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <p className="w-36 shrink-0 truncate text-[13px] font-medium text-ink sm:w-44">
                  {c.name}
                </p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[13px] font-semibold tnum">
                  {c.pct}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
            Website checkout remains the dominant channel; Partner referrals are the smallest but
            carry the highest average order value.
          </p>
        </section>
      </div>

      {/* top events table (View all → full searchable/paginated list) */}
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
              {topEvents.map((e) => (
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
                  <td className="text-ink tnum">{nf(e.regs)}</td>
                  <td className="font-semibold text-ink tnum">฿{nf(e.rev)}</td>
                  <td className="text-muted tnum">{e.att ? `${e.att}%` : '—'}</td>
                  <td>
                    <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PageFooter />
    </>
  )
}
