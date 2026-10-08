import { useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  EventPicker,
  Paginator,
  usePagination,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { baht } from '@/lib/format'
import { REPORT_PAYOUTS, REPORT_PAYOUT_BADGE } from '../data/reportsPayouts'

export default function ReportsPayoutsPage() {
  const [event, setEvent] = useState<string>('All events')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return REPORT_PAYOUTS.filter((r) => {
      if (!(event === 'All events' || r.event === event)) return false
      if (!query) return true
      return (
        (r.ref + ' ' + r.bank + ' ' + r.covered + ' ' + r.status).toLowerCase().indexOf(query) !== -1
      )
    })
  }, [event, q])

  const pager = usePagination(filtered)
  const { setPage } = pager

  const onSearch = (v: string) => {
    setQ(v)
    setPage(1)
  }
  const onEvent = (v: string) => {
    setEvent(v)
    setPage(1)
  }

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="Bank withdrawals and pending balance."
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

      {/* filter bar: search + event */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="Search reference, bank or event…"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <EventPicker
            value={event}
            onChange={onEvent}
            className="h-10 w-full border-0 bg-surface text-[14px] font-semibold"
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-bank text-[16px]" />
            Paid out
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿2.9M</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              9.7%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-clock-01 text-[16px]" />
            Pending
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿180k</p>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-truck-delivery text-[16px]" />
            In transit
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿240k</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              4.0%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Avg payout
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿182k</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              3.2%
            </span>
          </div>
        </div>
      </div>

      {/* detailed table: payout history */}
      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Payout history</h2>
            <p className="mt-0.5 text-[12px] text-muted">Settlements to your bank</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Bank</th>
                <th>Events covered</th>
                <th className="text-right">Amount ฿</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((r) => (
                  <tr key={r.ref}>
                    <td className="font-semibold text-ink">{r.ref}</td>
                    <td className="text-muted">{r.date}</td>
                    <td className="text-muted tnum">{r.bank}</td>
                    <td className="text-ink">{r.covered}</td>
                    <td className="text-right font-semibold text-ink tnum">{baht(r.amount)}</td>
                    <td>
                      <span className={cn('badge', REPORT_PAYOUT_BADGE[r.status])}>{r.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[13px] text-muted">
                    No payouts for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="payouts"
        />
      </section>

      <PageFooter />
    </>
  )
}
