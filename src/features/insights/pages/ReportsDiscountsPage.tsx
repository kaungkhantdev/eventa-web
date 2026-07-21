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
import { baht, num } from '@/lib/format'
import { DISCOUNT_CODES, DISCOUNT_STATUS_BADGE } from '../data/reportsDiscounts'

export default function ReportsDiscountsPage() {
  const [event, setEvent] = useState<string>('All events')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return DISCOUNT_CODES.filter((r) => {
      if (!(event === 'All events' || r.event === event)) return false
      if (!query) return true
      return (
        (r.code + ' ' + r.type + ' ' + r.event + ' ' + r.status).toLowerCase().indexOf(query) !== -1
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
        title="Discounts"
        subtitle="Promo usage and savings across all events."
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
            placeholder="Search code, type or event…"
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
            <i className="hgi-stroke hgi-discount-tag-01 text-[16px]" />
            Active codes
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">14</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />2 new
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-ticket-01 text-[16px]" />
            Redemptions
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">316</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              18.5%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-money-bag-02 text-[16px]" />
            Discount given
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿148k</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-red-500">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              12.0%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Revenue influenced
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿1.2M</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              14.3%
            </span>
          </div>
        </div>
      </div>

      {/* detailed table: discount codes */}
      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Discount codes</h2>
            <p className="mt-0.5 text-[12px] text-muted">Usage &amp; revenue impact</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th className="text-right">Redemptions</th>
                <th className="text-right">Discount ฿</th>
                <th className="text-right">Revenue ฿</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((r) => (
                  <tr key={r.code}>
                    <td>
                      <span className="font-mono font-semibold uppercase text-ink">{r.code}</span>
                    </td>
                    <td className="text-muted">{r.type}</td>
                    <td className="text-right text-ink tnum">{num(r.redemptions)}</td>
                    <td className="text-right text-muted tnum">{baht(r.discount)}</td>
                    <td className="text-right font-semibold text-ink tnum">{baht(r.revenue)}</td>
                    <td>
                      <span className={cn('badge', DISCOUNT_STATUS_BADGE[r.status])}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[13px] text-muted">
                    No discount codes for this selection.
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
          noun="codes"
        />
      </section>

      <PageFooter />
    </>
  )
}
