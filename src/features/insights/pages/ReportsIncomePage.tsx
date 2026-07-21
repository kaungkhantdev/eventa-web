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
import { baht } from '@/lib/format'
import { INCOME_ROWS } from '../data/reportsIncome'

export default function ReportsIncomePage() {
  const [event, setEvent] = useState<string>('All events')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return INCOME_ROWS.filter((r) => {
      if (!(event === 'All events' || r.name === event)) return false
      if (!query) return true
      return (r.name + ' ' + r.meta).toLowerCase().indexOf(query) !== -1
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
        title="Income"
        subtitle="Gross revenue, refunds & fees across all events."
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
            placeholder="Search events…"
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
            <i className="hgi-stroke hgi-money-bag-02 text-[16px]" />
            Gross revenue
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿3.64M</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              11.8%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-delivery-return-01 text-[16px]" />
            Refunds
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿94k</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-down-right-01 text-[13px]" />
              5.1%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-credit-card text-[16px]" />
            Processing fees
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿89k</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-red-500">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              0.6%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Net revenue
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿3.46M</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              12.5%
            </span>
          </div>
        </div>
      </div>

      {/* detailed table: income by event */}
      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Income by event</h2>
            <p className="mt-0.5 text-[12px] text-muted">Gross, refunds & fees per event</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Event</th>
                <th className="text-right">Gross ฿</th>
                <th className="text-right">Refunds ฿</th>
                <th className="text-right">Fees ฿</th>
                <th className="text-right">Net ฿</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((r) => (
                  <tr key={r.name}>
                    <td>
                      <div>
                        <p className="font-semibold text-ink">{r.name}</p>
                        <p className="text-[11px] text-muted">{r.meta}</p>
                      </div>
                    </td>
                    <td className="text-right text-ink tnum">{baht(r.gross)}</td>
                    <td className="text-right text-muted tnum">{baht(r.refunds)}</td>
                    <td className="text-right text-muted tnum">{baht(r.fees)}</td>
                    <td className="text-right font-semibold text-ink tnum">{baht(r.net)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[13px] text-muted">
                    No income for this selection.
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
          noun="events"
        />
      </section>

      <PageFooter />
    </>
  )
}
