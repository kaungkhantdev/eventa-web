import { useLoaderData } from 'react-router'
import {
  Badge,
  ExportMenu,
  HeaderUser,
  PageFooter,
  PageHeader,
  Paginator,
} from '@/components/ui'
import { useFilters } from '@/lib/useFilters'
import { ReportEmptyRow } from '../components/ReportEmptyRow'
import { ReportFilters } from '../components/ReportFilters'
import { StatTile } from '../components/StatTile'
import { REPORT_DOWNLOADS } from '../insights.exports'
import type { PayoutsReportData } from '../insights.routes'

/**
 * Payouts and settlement (US-RPT-07). Layout ported from the kit.
 *
 * Read-only, like every report. Three statuses — Paid, In transit, Pending — and
 * nothing else: a failed payout is not in this report, it is on Finance Payouts
 * with its retry (US-FIN-04). The bank is masked by the API to its last four
 * digits and shown as sent.
 *
 * A payout settles the takings of several events at once, so filtering to one
 * event still shows every payout that covers it, at its whole amount.
 *
 * The tiles have no change chip: the kit drew one, but no criterion asks for a
 * comparison here, and a percentage needs a previous period this report does
 * not have.
 */
export default function ReportsPayoutsPage() {
  const data = useLoaderData() as PayoutsReportData
  const { set, clear, emptyReason } = useFilters({ total: data.window.total })
  const { tiles } = data

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="Bank withdrawals and pending balance."
        actions={
          <>
            <ExportMenu downloads={REPORT_DOWNLOADS.payouts} query={data.exportQuery} />
            <HeaderUser />
          </>
        }
      />

      <ReportFilters events={data.events} searchLabel="Search reference or event" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon="hgi-bank" label="Paid out" value={tiles.paidOut} />
        <StatTile icon="hgi-clock-01" label="Pending" value={tiles.pending} />
        <StatTile icon="hgi-truck-delivery" label="In transit" value={tiles.inTransit} />
        <StatTile icon="hgi-wallet-01" label="Avg payout" value={tiles.average} />
      </div>

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
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.reference}>
                    <td className="font-semibold text-ink tnum">{row.reference}</td>
                    <td className="text-muted">{row.date}</td>
                    <td className="text-muted tnum">{row.bank}</td>
                    <td className="text-ink">{row.covered}</td>
                    <td className="text-right font-semibold text-ink tnum">{row.amount}</td>
                    <td>
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <ReportEmptyRow
                  colSpan={6}
                  noun="payouts"
                  reason={emptyReason}
                  onClear={clear}
                  headline="No payouts for this selection"
                >
                  No payout matches the current search and event filter. A payout appears under
                  every event it settles, so try a different reference or event, or widen the
                  period.
                </ReportEmptyRow>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          {...data.window}
          noun="payouts"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </section>

      <PageFooter />
    </>
  )
}
