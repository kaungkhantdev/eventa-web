import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  DownloadButton,
  HeaderUser,
  Hint,
  Icon,
  PageFooter,
  PageHeader,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import type { TaxesData } from '../finance.routes'
import type { TaxRow } from '../finance.types'

/**
 * The VAT ledger (US-FIN-11/12). Layout ported from taxes.html.
 *
 * Thailand files VAT monthly, due on the 15th of the following month. Filing
 * late is recorded rather than hidden — the surcharge depends on it, and the
 * organizer is the one who will be asked about it.
 *
 * Alone among the finance pages this one has no empty state, because it cannot
 * be empty: `/tax-periods` builds a row for every month of the requested year
 * whether or not anything was sold ("the ledger is always twelve rows, so it is
 * a fixed list rather than a page" — tax-periods.controller.ts), and the loader
 * always states a year inside the accepted range. A first-run workspace does
 * see twelve ฿0 rows under four ฿0 headlines, which is not much of a welcome —
 * but nothing in this loader's data distinguishes "never sold anything" from
 * "sold nothing in the year you are looking at", and the ledger is year-scoped,
 * so inferring a first run from the zeros would greet an organizer with real
 * VAT history who happened to page back a year.
 */
export default function TaxesPage() {
  const data = useLoaderData() as TaxesData
  const { set } = useFilters()
  const filtering = useIsFiltering()
  const filing = useDisclosure()
  const [target, setTarget] = useState<TaxRow | null>(null)

  return (
    <>
      <PageHeader
        title="Taxes"
        subtitle="VAT collected, remitted and still payable."
        actions={
          <>
            <DownloadButton
              path="/tax-periods/export.csv"
              query={{ year: data.year }}
              filename={`eventa-vat-${data.year}.csv`}
            />
            <HeaderUser />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Headline label="VAT collected" value={data.headlines.collected} icon="hgi-invoice-01" />
        <Headline label="VAT remitted" value={data.headlines.remitted} icon="hgi-checkmark-badge-01" />
        <Headline label="VAT payable" value={data.headlines.payable} icon="hgi-alert-circle" />
        <Headline label="Withholding" value={data.headlines.withholding} icon="hgi-percent" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="tax-year" className="text-[12px] text-muted">
          Tax year
        </label>
        <select
          id="tax-year"
          value={data.year}
          onChange={(e) => set({ year: e.target.value })}
          className="select h-10 border-0 bg-surface font-medium sm:w-32"
        >
          {data.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <Card className={cn('mt-3 p-4', filtering && 'opacity-60 transition-opacity')}>
        <div className="overflow-x-auto">
          <DataTable className="min-w-[880px]">
            <thead>
              <tr>
                <th>Period</th>
                <th>Due</th>
                <th>Sales (ex-VAT)</th>
                <th>VAT</th>
                <th>Withholding</th>
                <th>Remitted</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {data.rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-medium text-ink">{row.period}</td>
                  <td className="tnum text-muted">{row.due}</td>
                  <td className="tnum text-muted">{row.sales}</td>
                  <td className="tnum font-semibold text-ink">{row.vat}</td>
                  <td className="tnum text-muted">{row.withholding}</td>
                  <td className="tnum text-muted">{row.remitted}</td>
                  <td>
                    <Badge tone={row.statusTone} icon={row.statusIcon}>
          {row.statusLabel}
        </Badge>
                    {row.lateNote && (
                      <span className="ml-1.5 text-[11px] text-amber-500">{row.lateNote}</span>
                    )}
                  </td>
                  <td className="text-right">
                    {row.canFile && (
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => {
                          setTarget(row)
                          filing.onOpen()
                        }}
                      >
                        Record filing
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      </Card>

      <PageFooter />

      <FileModal open={filing.open} onClose={filing.onClose} target={target} />
    </>
  )
}

function Headline({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[12px] text-muted">
        <Icon name={icon} size={16} />
        {label}
      </div>
      <p className="tnum mt-2 text-[22px] font-bold tracking-tight">{value}</p>
    </div>
  )
}

/** Recording a filing with the Revenue Department (US-FIN-12). */
function FileModal({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target: TaxRow | null
}) {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('VAT period filed.')
    onClose()
  }, [done, open, onClose])

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <fetcher.Form method="post" className="p-5">
          <input type="hidden" name="year" value={target?.year ?? ''} />
          <input type="hidden" name="month" value={target?.month ?? ''} />
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon name="hgi-checkmark-badge-01" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Record this filing?</h3>
          <p className="mt-1 text-[13px] text-muted">
            {target ? `${target.period} · VAT ${target.vat} · due ${target.due}` : ''}
          </p>

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-red-500">
              {error}
            </p>
          )}

          {/*
           * No "amount remitted" box. US-FIN-12 is explicit that the remitted
           * figure IS the period's VAT — "its remitted amount shows ฿210,896"
           * for a period whose VAT is ฿210,896 — so it is derived, not typed,
           * and `FileTaxPeriodDto` declares no such field. Sending it was
           * refused outright and every filing answered 400, which reached the
           * admin as a bare "Validation failed." The VAT being recorded is
           * restated above instead, which is the whole of the decision.
           */}
          <Hint className="mt-3">
            This records the VAT above as remitted and marks the period Filed.
          </Hint>

          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              type="submit"
              disabled={fetcher.state !== 'idle'}
            >
              {fetcher.state === 'idle' ? 'Record filing' : 'Recording…'}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  )
}
