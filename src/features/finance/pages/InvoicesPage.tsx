import { useEffect, useState } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  DownloadButton,
  EmptyState,
  HeaderUser,
  Icon,
  Input,
  Label,
  NoResults,
  PageFooter,
  PageHeader,
  Paginator,
  PastEnd,
  PillTabs,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import type { InvoiceTab, InvoicesData, TabCounts } from '../finance.routes'
import type { InvoiceRow } from '../finance.types'

/**
 * Tax invoices (US-FIN-06..10). Layout ported from invoices.html.
 *
 * Whether an invoice may be voided is the API's answer — a paid one cannot be,
 * and a voided one is already gone. The reason travels with the verdict so a
 * disabled control explains itself.
 */

const ALL_EVENTS = 'All events'
const MAX_SEARCH_LENGTH = 120

export default function InvoicesPage() {
  const data = useLoaderData() as InvoicesData
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })
  const filtering = useIsFiltering()
  const voiding = useDisclosure()
  const [target, setTarget] = useState<InvoiceRow | null>(null)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const firstRun = data.rows.length === 0 && emptyReason === 'first-run'

  const header = (
    <PageHeader
      title="Invoices"
      subtitle="Tax invoices issued for your events."
      actions={
        <>
          {/* `/invoices/export.csv` answers 409 "nothing to export" on an empty
              set, so on a first run the only thing this button can do is
              contradict the sentence beside it. */}
          {!firstRun && (
            <DownloadButton
              path="/invoices/export.csv"
              query={data.exportQuery}
              filename="eventa-invoices.csv"
            />
          )}
          <HeaderUser />
        </>
      }
    />
  )

  // Nothing has been invoiced yet, so the status tabs are all zero and there is
  // nothing to search or page through: the controls go with the table, and the
  // page says what will fill it instead.
  //
  // The kit's copy here ("Eventa raises an invoice for every order a buyer
  // places") describes a product this one is not. `POST /invoices` takes one
  // `orderId` and nothing in the API, worker or relay calls it on settlement —
  // an invoice is raised deliberately, against a chosen order. Promising it
  // arrives by itself would send an organizer away to sell tickets and back to
  // the same empty page, so the copy departs from the source deliberately.
  if (firstRun) {
    return (
      <>
        {header}

        <Card>
          <EmptyState
            icon="hgi-invoice-01"
            title="No invoices yet"
            actions={[
              {
                label: 'Add your billing details',
                to: '/admin/settings-organization',
                icon: 'hgi-building-03',
              },
              { label: 'Create your first event', to: '/admin/event-form' },
            ]}
          >
            A tax invoice is raised against one order at a time, and keeps its number for good —
            selling a ticket does not issue one by itself. Set up the tax details that go on them,
            then start taking orders; the invoices you raise are listed here.
          </EmptyState>
        </Card>

        <PageFooter />
      </>
    )
  }

  return (
    <>
      {header}

      <PillTabs<InvoiceTab>
        items={tabItems(data.tabs)}
        value={(params.get('tab') as InvoiceTab) ?? 'all'}
        onChange={(tab) => set({ tab: tab === 'all' ? null : tab })}
      />

      <div className={cn('mt-3', filtering && 'opacity-60 transition-opacity')}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full flex-1">
            <Icon
              name="hgi-search-01"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
              placeholder="Search invoice number, buyer or order…"
              maxLength={MAX_SEARCH_LENGTH}
              aria-label="Search invoices"
            />
          </div>
          <select
            value={params.get('eventId') ?? ''}
            onChange={(e) => set({ eventId: e.target.value || null })}
            className="select h-10 border-0 bg-surface font-medium sm:w-52"
            aria-label="Filter by event"
          >
            <option value="">{ALL_EVENTS}</option>
            {data.events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <Card className="mt-3 p-4">
          <div className="overflow-x-auto">
            <DataTable className="min-w-[960px]">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Buyer</th>
                  <th>Event</th>
                  <th>VAT</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {data.rows.map((row) => (
                  <InvoiceTableRow
                    key={row.id}
                    row={row}
                    onVoid={() => {
                      setTarget(row)
                      voiding.onOpen()
                    }}
                  />
                ))}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      {emptyReason === 'past-end' ? (
                        <PastEnd noun="invoices" onFirstPage={clear} />
                      ) : (
                        <NoResults noun="invoices" onClear={clear}>
                          No invoice matches the current search, event and status filters. Try a
                          different invoice number or buyer, or widen the filters.
                        </NoResults>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </div>

          <Paginator
            {...data.window}
            noun="invoices"
            onPage={(page) => set({ page })}
            onSize={(size) => set({ limit: size, page: null })}
          />
        </Card>
      </div>

      <PageFooter />

      <VoidModal open={voiding.open} onClose={voiding.onClose} target={target} />
    </>
  )
}

function tabItems(counts: TabCounts): PillTabItem<InvoiceTab>[] {
  return [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'issued', label: 'Issued', count: counts.issued },
    { value: 'paid', label: 'Paid', count: counts.paid },
    { value: 'overdue', label: 'Overdue', count: counts.overdue },
    { value: 'void', label: 'Void', count: counts.void },
  ]
}

function InvoiceTableRow({ row, onVoid }: { row: InvoiceRow; onVoid: () => void }) {
  return (
    <tr>
      <td className="tnum font-medium text-ink">{row.number}</td>
      <td>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-medium text-ink">{row.buyer}</p>
          <p className="truncate text-[11px] text-muted">{row.buyerEmail}</p>
        </div>
      </td>
      <td className="text-muted">{row.event}</td>
      <td className="tnum text-muted">{row.vat}</td>
      <td className="tnum font-semibold text-ink">{row.amount}</td>
      <td>
        <Badge tone={row.statusTone}>{row.statusLabel}</Badge>
      </td>
      <td className="text-muted">
        <span className="tnum">{row.due}</span>
        <span
          className={cn(
            'ml-1.5 block text-[11px]',
            row.status === 'overdue' ? 'text-red-500' : 'text-muted',
          )}
        >
          {row.dueNote}
        </span>
      </td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-1">
          {/* The API renders the invoice itself, as an SVG — labelled for what
              it actually is rather than "PDF", which it is not. */}
          <DownloadButton
            path={`/invoices/${row.id}/invoice.svg`}
            filename={`${row.number}.svg`}
            label="Invoice"
          />
          <button
            type="button"
            className="btn-icon"
            onClick={onVoid}
            disabled={!row.canVoid}
            title={row.canVoid ? 'Void invoice' : (row.voidBlockedReason ?? 'Cannot be voided')}
          >
            <Icon name="hgi-cancel-circle" size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/**
 * Voiding an invoice (US-FIN-10).
 *
 * A void is not a delete: the number stays, marked void, because a tax invoice
 * that simply disappeared is a hole in the sequence the Revenue Department
 * expects to be continuous.
 */
function VoidModal({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target: InvoiceRow | null
}) {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (done && open) onClose()
  }, [done, open, onClose])

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <fetcher.Form method="post" className="p-5">
          <input type="hidden" name="invoiceId" value={target?.id ?? ''} />
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
            <Icon name="hgi-cancel-circle" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Void this invoice?</h3>
          <p className="mt-1 text-[13px] text-muted">
            {target ? `${target.number} · ${target.buyer} · ${target.amount}` : ''}
          </p>
          <p className="mt-2 text-[12px] text-muted">
            The number stays in the sequence, marked void. It is not deleted.
          </p>

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-red-500">
              {error}
            </p>
          )}

          <div className="mt-4">
            <Label htmlFor="void-reason">Reason</Label>
            <Input id="void-reason" name="reason" type="text" placeholder="Optional note" />
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="soft" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              type="submit"
              disabled={fetcher.state !== 'idle'}
            >
              {fetcher.state === 'idle' ? 'Void invoice' : 'Voiding…'}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  )
}
