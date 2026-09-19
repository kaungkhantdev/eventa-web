import { Link, useLoaderData } from 'react-router'
import {
  Badge,
  DownloadButton,
  HeaderUser,
  PageFooter,
  PageHeader,
  Paginator,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useFilters } from '@/lib/useFilters'
import { ReportEmptyRow } from '../components/ReportEmptyRow'
import { ReportFilters } from '../components/ReportFilters'
import { StatTile } from '../components/StatTile'
import type { TransactionsReportData } from '../insights.routes'

/**
 * The transaction ledger (US-RPT-06). Layout ported from the kit.
 *
 * Read-only by design: this report never changes money. A reference links
 * through to the payment, which is where refunding lives.
 *
 * A refund is its own row, showing "-฿1,250" in the warning colour — the API
 * keeps every amount positive so its sums cannot be poisoned, and the sign is
 * applied once, at the edge.
 */
export default function ReportsTransactionsPage() {
  const data = useLoaderData() as TransactionsReportData
  const { set, clear, emptyReason } = useFilters({ total: data.window.total })
  const { tiles } = data

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every payment and refund across all events."
        actions={
          <>
            <DownloadButton
              path="/reports/transactions.csv"
              query={data.exportQuery}
              filename="eventa-transactions.csv"
            />
            <HeaderUser />
          </>
        }
      />

      <ReportFilters events={data.events} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon="hgi-invoice-01" label="Transactions" value={tiles.entries} />
        <StatTile icon="hgi-wallet-01" label="Payments" value={tiles.collected} />
        <StatTile icon="hgi-delivery-return-01" label="Refunds" value={tiles.refunds} />
        <StatTile icon="hgi-checkmark-badge-01" label="Success rate" value={tiles.successRate} />
      </div>

      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Transactions</h2>
            <p className="mt-0.5 text-[12px] text-muted">Payments &amp; refunds ledger</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Payer</th>
                <th>Event</th>
                <th>Method</th>
                <th className="text-right">Amount ฿</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        to={row.href}
                        className="font-semibold text-ink hover:text-brand hover:underline tnum"
                      >
                        {row.reference}
                      </Link>
                    </td>
                    <td className="text-muted">{row.date}</td>
                    <td className="text-ink">{row.person}</td>
                    <td className="text-muted">{row.event}</td>
                    <td className="text-muted">{row.method}</td>
                    <td
                      className={cn(
                        'text-right font-semibold tnum',
                        row.outgoing ? 'text-red-500' : 'text-ink',
                      )}
                    >
                      {row.amount}
                    </td>
                    <td className="text-muted">{row.type}</td>
                    <td>
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <ReportEmptyRow colSpan={8} noun="transactions" reason={emptyReason} onClear={clear}>
                  No payment or refund matches the current search and event filter. Try a different
                  reference or payer, or widen the period.
                </ReportEmptyRow>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          {...data.window}
          noun="transactions"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </section>

      <PageFooter />
    </>
  )
}
