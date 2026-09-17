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
import type { IncomeReportData } from '../insights.routes'

/**
 * Income and reconciliation (US-RPT-05). Layout ported from the kit.
 *
 * Net is gross less VAT and refunds — the same figure the overview calls
 * revenue, from the same expression in Payments. Fees come off separately,
 * because what reaches the bank is what reconciliation compares against.
 */
export default function ReportsIncomePage() {
  const data = useLoaderData() as IncomeReportData
  const { set } = useFilters()
  const { tiles } = data

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

      <ReportFilters events={data.events} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon="hgi-money-bag-02" label="Gross revenue" tile={tiles.gross} />
        <StatTile icon="hgi-delivery-return-01" label="Refunds" tile={tiles.refunds} />
        <StatTile icon="hgi-credit-card" label="Processing fees" tile={tiles.fees} />
        <StatTile icon="hgi-wallet-01" label="Net revenue" tile={tiles.net} />
      </div>

      <section className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">Income by event</h2>
            <p className="mt-0.5 text-[12px] text-muted">Gross, refunds &amp; fees per event</p>
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
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-ink">{row.name}</p>
                        <p className="text-[11px] text-muted">{row.meta}</p>
                      </div>
                    </td>
                    <td className="text-right text-ink tnum">{row.gross}</td>
                    <td className="text-right text-muted tnum">{row.refunds}</td>
                    <td className="text-right text-muted tnum">{row.fees}</td>
                    <td className="text-right font-semibold text-ink tnum">{row.net}</td>
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
