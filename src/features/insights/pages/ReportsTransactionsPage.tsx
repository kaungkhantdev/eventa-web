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
import {
  TRANSACTIONS,
  TXN_TYPE_BADGE,
  TXN_STATUS_BADGE,
  type Transaction,
} from '../data/reportsTransactions'

function AmountCell({ r }: { r: Transaction }) {
  return r.type === 'Refund' ? (
    <span className="font-semibold text-red-500">-{baht(r.amount)}</span>
  ) : (
    <span className="font-semibold text-ink">{baht(r.amount)}</span>
  )
}

export default function ReportsTransactionsPage() {
  const [event, setEvent] = useState<string>('All events')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return TRANSACTIONS.filter((r) => {
      if (!(event === 'All events' || r.event === event)) return false
      if (!query) return true
      return (
        (r.ref + ' ' + r.attendee + ' ' + r.event + ' ' + r.method + ' ' + r.type + ' ' + r.status)
          .toLowerCase()
          .indexOf(query) !== -1
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
        title="Transactions"
        subtitle="Every charge and refund across all events."
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
            placeholder="Search reference, attendee or event…"
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
            <i className="hgi-stroke hgi-exchange-01 text-[16px]" />
            Transactions
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">1,482</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              6.4%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Payments
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">฿3.55M</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              11.2%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-delivery-return-01 text-[16px]" />
            Refunds
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">41</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-down-right-01 text-[13px]" />
              8.3%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-checkmark-badge-01 text-[16px]" />
            Success rate
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">98.6%</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              0.3%
            </span>
          </div>
        </div>
      </div>

      {/* detailed table: all transactions */}
      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">All transactions</h2>
            <p className="mt-0.5 text-[12px] text-muted">Payments & refunds ledger</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[880px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Attendee</th>
                <th>Event</th>
                <th>Method</th>
                <th className="text-right">Amount ฿</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((r) => (
                  <tr key={r.ref}>
                    <td className="font-semibold text-ink tnum">{r.ref}</td>
                    <td className="whitespace-nowrap text-muted">{r.date}</td>
                    <td className="text-ink">{r.attendee}</td>
                    <td className="text-muted">{r.event}</td>
                    <td className="text-muted">{r.method}</td>
                    <td className="text-right tnum">
                      <AmountCell r={r} />
                    </td>
                    <td>
                      <span className={cn('badge', TXN_TYPE_BADGE[r.type])}>{r.type}</span>
                    </td>
                    <td>
                      <span className={cn('badge', TXN_STATUS_BADGE[r.status])}>{r.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[13px] text-muted">
                    No transactions for this selection.
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
          noun="transactions"
        />
      </section>

      <PageFooter />
    </>
  )
}
