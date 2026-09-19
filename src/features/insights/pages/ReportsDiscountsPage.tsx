import { useLoaderData } from 'react-router'
import {
  Badge,
  DownloadButton,
  HeaderUser,
  PageFooter,
  PageHeader,
  Paginator,
} from '@/components/ui'
import { useFilters } from '@/lib/useFilters'
import { ReportEmptyRow } from '../components/ReportEmptyRow'
import { ReportFilters } from '../components/ReportFilters'
import { StatTile } from '../components/StatTile'
import type { DiscountsReportData } from '../insights.routes'

/**
 * Promotion and discount payback (US-RPT-10). Layout ported from the kit.
 *
 * "Revenue influenced" is the value of the confirmed orders a code was used on,
 * after the discount — order value, not settled cash, and deliberately not the
 * income report's net. A promotion's job is to cause orders; crediting it only
 * once the money clears would make a code look worthless for as long as a bank
 * transfer takes.
 *
 * The tiles carry no change chip. A code's payback is its lifetime payback, so
 * there is no previous period to compare it against, and a chip that always
 * read "—" would look like data that failed to load.
 */
export default function ReportsDiscountsPage() {
  const data = useLoaderData() as DiscountsReportData
  const { set, clear, emptyReason } = useFilters({ total: data.window.total })
  const { tiles } = data

  return (
    <>
      <PageHeader
        title="Discounts"
        subtitle="Promotion usage and the revenue it influenced."
        actions={
          <>
            <DownloadButton
              path="/reports/discounts.csv"
              query={data.exportQuery}
              filename="eventa-discounts.csv"
            />
            <HeaderUser />
          </>
        }
      />

      <ReportFilters events={data.events} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon="hgi-discount-tag-01" label="Active codes" value={tiles.activeCodes} />
        <StatTile icon="hgi-ticket-01" label="Redemptions" value={tiles.redemptions} />
        <StatTile icon="hgi-money-bag-02" label="Discount given" value={tiles.discount} />
        <StatTile icon="hgi-wallet-01" label="Revenue influenced" value={tiles.influenced} />
      </div>

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
                <th className="text-right">Return</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-ink">{row.code}</p>
                        <p className="text-[11px] text-muted">{row.scope}</p>
                      </div>
                    </td>
                    <td className="text-muted">{row.terms}</td>
                    <td className="text-right text-ink tnum">{row.redemptions}</td>
                    <td className="text-right text-muted tnum">{row.discount}</td>
                    <td className="text-right font-semibold text-ink tnum">{row.influenced}</td>
                    <td className="text-right text-muted tnum">{row.returnRatio}</td>
                    <td>
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <ReportEmptyRow colSpan={7} noun="codes" reason={emptyReason} onClear={clear}>
                  No discount code matches the current search and event filter. Try a different
                  code, or widen the period.
                </ReportEmptyRow>
              )}
            </tbody>
          </table>
        </div>

        <Paginator
          {...data.window}
          noun="codes"
          onPage={(page) => set({ page })}
          onSize={(size) => set({ limit: size, page: null })}
        />
      </section>

      <PageFooter />
    </>
  )
}
