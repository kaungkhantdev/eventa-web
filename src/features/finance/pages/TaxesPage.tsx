import { useEffect, useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Card,
  Icon,
  PillTabs,
  Paginator,
  usePagination,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  TAX_ROWS,
  TAX_STATUS_BADGE,
  TAX_YEARS,
  baht,
  bahtShort,
  type TaxStatus,
} from '../data/taxes'

type TaxTab = 'all' | TaxStatus

export default function TaxesPage() {
  const [tab, setTab] = useState<TaxTab>('all')
  const [year, setYear] = useState('')

  // pill-tab counts computed from the data
  const counts = useMemo(
    () => ({
      all: TAX_ROWS.length,
      Filed: TAX_ROWS.filter((r) => r.st === 'Filed').length,
      Due: TAX_ROWS.filter((r) => r.st === 'Due').length,
      Upcoming: TAX_ROWS.filter((r) => r.st === 'Upcoming').length,
    }),
    [],
  )

  const tabs: PillTabItem<TaxTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'Filed', label: 'Filed', count: counts.Filed },
    { value: 'Due', label: 'Due', count: counts.Due },
    { value: 'Upcoming', label: 'Upcoming', count: counts.Upcoming },
  ]

  /* KPI headlines are DERIVED from the same rows the table renders, scoped to the
     year filter (not the status tab). payable = collected - remitted is an identity
     here, so the headline figures can never drift from the column beneath them. */
  const kpis = useMemo(() => {
    const scope = TAX_ROWS.filter((r) => !year || String(r.year) === year)
    const collected = scope.reduce((s, r) => s + r.vat, 0)
    const remitted = scope.reduce((s, r) => s + (r.st === 'Filed' ? r.vat : 0), 0)
    const wht = scope.reduce((s, r) => s + r.wht, 0)
    return { collected, remitted, payable: collected - remitted, wht }
  }, [year])

  const filtered = useMemo(
    () =>
      TAX_ROWS.filter(
        (r) => (tab === 'all' || r.st === tab) && (!year || String(r.year) === year),
      ),
    [tab, year],
  )

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [tab, year, setPage])

  return (
    <>
      <PageHeader
        title="Taxes"
        subtitle="VAT collected and remitted."
        actions={
          <>
            <Button variant="ghost">
              <Icon name="hgi-download-01" size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-percent-circle text-[16px]" />
            VAT collected
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{bahtShort(kpis.collected)}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              11.4%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-checkmark-badge-01 text-[16px]" />
            VAT remitted
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{bahtShort(kpis.remitted)}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              9.8%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-clock-01 text-[16px]" />
            VAT payable
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{bahtShort(kpis.payable)}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              2.6%
            </span>
          </div>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-taxes text-[16px]" />
            Withholding tax
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[22px] font-bold tracking-tight tnum">{bahtShort(kpis.wht)}</p>
            <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand">
              <i className="hgi-stroke hgi-arrow-up-right-01 text-[13px]" />
              3.1%
            </span>
          </div>
        </div>
      </div>

      {/* filter row: filing status tabs + year */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PillTabs items={tabs} value={tab} onChange={setTab} />
        <div className="relative w-full sm:w-40">
          <i className="hgi-stroke hgi-calendar-03 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium sm:w-40"
          >
            <option value="">All years</option>
            {TAX_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>Period</th>
                <th className="text-right">Taxable sales ฿</th>
                <th className="text-right">VAT collected ฿</th>
                <th className="text-right">Withholding ฿</th>
                <th className="text-right">Remitted ฿</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((r) => {
                  const s = TAX_STATUS_BADGE[r.st]
                  const filing = (r.st === 'Filed' ? 'Filed ' : 'Due ') + r.due
                  return (
                    <tr key={r.period}>
                      <td>
                        <p className="font-semibold text-ink">{r.period}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{filing}</p>
                      </td>
                      <td className="text-right text-ink tnum">{baht(r.sales)}</td>
                      <td className="text-right font-semibold text-ink tnum">{baht(r.vat)}</td>
                      <td className="text-right text-muted tnum">{baht(r.wht)}</td>
                      {r.remitted ? (
                        <td className="text-right font-semibold text-ink tnum">
                          {baht(r.remitted)}
                        </td>
                      ) : (
                        <td className="text-right text-muted tnum">—</td>
                      )}
                      <td>
                        <span className={s.cls}>
                          <i className={cn('hgi-stroke', s.icon, 'text-[12px]')} />
                          {r.st}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[13px] text-muted">
                    No periods match your filters.
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
          noun="periods"
        />
      </Card>

      <PageFooter />
    </>
  )
}
