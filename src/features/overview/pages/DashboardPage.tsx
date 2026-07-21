import { useState } from 'react'
import { Link } from 'react-router'
import {
  AreaChart,
  ButtonLink,
  DonutChart,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  Segmented,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  REVENUE,
  RECENT_REGISTRATIONS,
  SELLING_FAST,
  STATUS_BADGE,
  STAT_CARDS,
  TICKET_TYPES,
  type RevenueRange,
} from '../data/dashboard'

const RANGE_ITEMS: { value: RevenueRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

const TOTAL_REGISTRATIONS = '1,340'

/** Faithful port of admin/dashboard.html. */
export default function DashboardPage() {
  const [range, setRange] = useState<RevenueRange>('year')
  const rev = REVENUE[range]

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Harper — here's what's happening with your events."
        actions={
          <>
            <ButtonLink to="/admin/event-form" variant="primary" className="shrink-0">
              <Icon name="hgi-calendar-add-01" size={16} />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </ButtonLink>
            <HeaderUser />
          </>
        }
      />

      {/* stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={cn('rounded-2xl bg-surface p-3.5', s.span)}>
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <Icon name={s.icon} size={16} />
              {s.label}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <p className="tnum text-[22px] font-bold tracking-tight">{s.value}</p>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-[12px] font-semibold',
                  s.deltaColor,
                )}
              >
                <Icon name={s.deltaIcon} size={13} />
                {s.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* revenue + donut row */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section className="rounded-2xl bg-surface p-4 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">Revenue Overview</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="tnum text-[24px] font-extrabold tracking-tight">{rev.value}</span>
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[13px] font-semibold',
                    rev.up ? 'text-brand' : 'text-red-500',
                  )}
                >
                  <Icon
                    name={rev.up ? 'hgi-arrow-up-right-01' : 'hgi-arrow-down-right-01'}
                    size={13}
                  />
                  {rev.delta}
                </span>
                <span className="text-[12px] text-muted">vs previous period</span>
              </div>
            </div>
            <Segmented items={RANGE_ITEMS} value={range} onChange={setRange} />
          </div>
          <div className="mt-2">
            <AreaChart
              labels={rev.labels}
              values={rev.values}
              max={rev.max}
              prefix="฿"
              suffix="k"
              ariaLabel="Revenue overview"
            />
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-4 xl:col-span-2">
          <h2 className="text-[15px] font-bold tracking-tight">Registrations by Ticket Type</h2>
          <p className="mt-0.5 text-[12px] text-muted">Share of total registrations</p>
          <div className="mt-2 flex justify-center">
            <DonutChart
              data={TICKET_TYPES.map((t) => ({ value: t.pct, color: t.color, label: t.name }))}
              size={160}
              centerLabel={TOTAL_REGISTRATIONS}
              centerSub="total registrations"
              ariaLabel="Registrations by ticket type"
            />
          </div>
          <div className="mt-4 space-y-3">
            {TICKET_TYPES.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded"
                    style={{ background: t.color }}
                  />
                  <div className="leading-tight">
                    <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                    <p className="tnum text-[11px] text-muted">{t.regs} registrations</p>
                  </div>
                </div>
                <span className="tnum text-[15px] font-bold">{t.pct}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* selling fast + recent registrations row */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <section className="rounded-2xl bg-surface p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">Tickets Selling Fast</h2>
            <Link
              to="/admin/tickets"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              Manage
            </Link>
          </div>
          <div className="mt-2">
            {SELLING_FAST.map((t) => (
              <div
                key={t.name}
                className={cn(
                  'flex items-center gap-3 py-3',
                  t.border && 'border-t border-line',
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl',
                    t.iconClass,
                  )}
                >
                  <Icon name={t.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                  <p className="text-[11px] text-muted">{t.meta}</p>
                </div>
                <span className={cn('text-[13px] font-semibold', t.leftColor)}>{t.left}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">Recent Registrations</h2>
            <Link
              to="/admin/registrations"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-2 pr-3 font-semibold">Attendee</th>
                  <th className="pb-2 pr-3 font-semibold">Event</th>
                  <th className="pb-2 pr-3 font-semibold">Amount</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {RECENT_REGISTRATIONS.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-dark dark:text-brand">
                          {r.initials}
                        </span>
                        <span className="font-medium text-ink">{r.name}</span>
                      </div>
                    </td>
                    <td className="pr-3 text-muted">{r.event}</td>
                    <td className="tnum pr-3 font-semibold text-ink">{r.amount}</td>
                    <td className="pr-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
                          STATUS_BADGE[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="tnum text-right text-muted">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PageFooter />
    </>
  )
}
