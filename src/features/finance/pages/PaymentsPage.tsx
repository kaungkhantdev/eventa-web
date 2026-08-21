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
  Hint,
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
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFilters, useSearchBox } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import { METHODS, type LedgerTab, type PaymentsData, type TabCounts } from '../payments.routes'
import type { PaymentRow } from '../payments.types'

/**
 * The payments ledger (US-FIN-01/02). Layout ported from payments.html.
 *
 * Whether a charge can be refunded is the API's answer, not this page's: it
 * knows the provider's window and what has already gone back. A control that
 * cannot be used says why.
 */

const ALL_EVENTS = 'All events'
const ALL_METHODS = 'All methods'
const MAX_SEARCH_LENGTH = 120

export default function PaymentsPage() {
  const data = useLoaderData() as PaymentsData
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })
  const filtering = useIsFiltering()
  const refund = useDisclosure()
  const [refunding, setRefunding] = useState<PaymentRow | null>(null)
  const [term, setTerm] = useSearchBox(params.get('q') ?? '', (q) => set({ q }, { replace: true }))

  const firstRun = data.rows.length === 0 && emptyReason === 'first-run'

  const header = (
    <PageHeader
      title="Payments"
      subtitle="Every charge, refund and failed attempt."
      actions={
        <>
          {/* `/payments/export.csv` answers 409 "nothing to export" on an empty
              set, so on a first run the only thing this button can do is
              contradict the sentence beside it. */}
          {!firstRun && (
            <DownloadButton
              path="/payments/export.csv"
              query={data.exportQuery}
              filename="eventa-payments.csv"
            />
          )}
          <HeaderUser />
        </>
      }
    />
  )

  // No money has moved yet: the status tabs are all zero and there is nothing to
  // search, so the controls go with the table rather than sitting above nothing.
  if (firstRun) {
    return (
      <>
        {header}

        <Card>
          <EmptyState
            icon="hgi-credit-card"
            title="No payments yet"
            actions={[
              {
                label: 'Create your first event',
                to: '/admin/event-form',
                icon: 'hgi-calendar-add-01',
              },
              { label: 'Set up payments', to: '/admin/settings-payments' },
            ]}
          >
            Every charge, refund and failed attempt lands here the moment a buyer pays. Publish an
            event with a paid ticket and your first transaction will appear.
          </EmptyState>
        </Card>

        <PageFooter />
      </>
    )
  }

  return (
    <>
      {header}

      <PillTabs<LedgerTab>
        items={tabItems(data.tabs)}
        value={(params.get('tab') as LedgerTab) ?? 'all'}
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
              placeholder="Search transaction, attendee or event…"
              maxLength={MAX_SEARCH_LENGTH}
              aria-label="Search payments"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={params.get('method') ?? ''}
              onChange={(e) => set({ method: e.target.value || null })}
              className="select h-10 border-0 bg-surface font-medium sm:w-44"
              aria-label="Filter by method"
            >
              <option value="">{ALL_METHODS}</option>
              {METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
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
        </div>

        <Card className="mt-3 p-4">
          <div className="overflow-x-auto">
            <DataTable className="min-w-[900px]">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Attendee</th>
                  <th>Event</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {data.rows.map((row) => (
                  <PaymentTableRow
                    key={row.id}
                    row={row}
                    onRefund={() => {
                      setRefunding(row)
                      refund.onOpen()
                    }}
                  />
                ))}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      {emptyReason === 'past-end' ? (
                        <PastEnd noun="transactions" onFirstPage={clear} />
                      ) : (
                        <NoResults noun="transactions" onClear={clear}>
                          No transaction matches the current search and filters. Try a different
                          name or reference, or widen the filters.
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
            noun="payments"
            onPage={(page) => set({ page })}
            onSize={(size) => set({ limit: size, page: null })}
          />
        </Card>
      </div>

      <PageFooter />

      <RefundModal open={refund.open} onClose={refund.onClose} target={refunding} />
    </>
  )
}

function tabItems(counts: TabCounts): PillTabItem<LedgerTab>[] {
  return [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'paid', label: 'Paid', count: counts.paid },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'refunded', label: 'Refunded', count: counts.refunded },
    { value: 'failed', label: 'Failed', count: counts.failed },
  ]
}

function PaymentTableRow({ row, onRefund }: { row: PaymentRow; onRefund: () => void }) {
  return (
    <tr>
      <td className="tnum font-medium text-ink">{row.txn}</td>
      <td>
        <div className="flex items-center gap-2">
          <span className="avatar h-7 w-7 text-[10px]">{row.initials}</span>
          <span className="truncate font-medium text-ink">{row.payer}</span>
        </div>
      </td>
      <td className="text-muted">{row.event}</td>
      <td>
        <span className="flex items-center gap-1.5 text-muted">
          <Icon name={row.methodIcon} size={15} />
          {row.method}
        </span>
      </td>
      <td className="tnum font-semibold text-ink">{row.amount}</td>
      <td>
        <Badge tone={row.statusTone}>{row.statusLabel}</Badge>
      </td>
      <td className="tnum text-muted">
        {row.date}
        <span className="ml-1.5 text-[11px]">{row.time}</span>
      </td>
      <td className="text-right">
        <button
          type="button"
          className="btn-icon"
          onClick={onRefund}
          disabled={!row.canRefund}
          // The API's own words on the control that cannot be used, so a greyed
          // button is an explanation rather than a dead end.
          title={row.canRefund ? 'Refund' : (row.refundBlockedReason ?? 'Not eligible for refund')}
        >
          <Icon name="hgi-arrow-turn-backward" size={16} />
        </button>
      </td>
    </tr>
  )
}

/**
 * Refunding a charge (US-FIN-02).
 *
 * The amount is optional: an empty box refunds all of it. A partial refund is
 * typed in baht and converted once, in the route — never arithmetic on the
 * formatted string in the row above.
 */
function RefundModal({
  open,
  onClose,
  target,
}: {
  open: boolean
  onClose: () => void
  target: PaymentRow | null
}) {
  const fetcher = useFetcher<ActionResult>()
  const error = fetcher.data?.ok === false ? fetcher.data.error : null
  const done = fetcher.state === 'idle' && fetcher.data?.ok === true

  useEffect(() => {
    if (!done || !open) return
    toast.success('Refund started.')
    onClose()
  }, [done, open, onClose])

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <fetcher.Form method="post" className="p-5">
          <input type="hidden" name="paymentId" value={target?.id ?? ''} />
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
            <Icon name="hgi-arrow-turn-backward" size={18} />
          </div>
          <h3 className="mt-3 text-[15px] font-bold tracking-tight">Refund this payment?</h3>
          <p className="mt-1 text-[13px] text-muted">
            {target ? `${target.txn} · ${target.payer} · ${target.amount}` : ''}
          </p>

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-red-500">
              {error}
            </p>
          )}

          <div className="mt-4">
            <Label htmlFor="refund-amount">Amount (฿)</Label>
            <Input id="refund-amount" name="amount" type="number" min={0} step={1} />
            <Hint>Leave blank to refund the full amount.</Hint>
          </div>
          <div className="mt-3">
            <Label htmlFor="refund-reason">Reason</Label>
            <Input id="refund-reason" name="reason" type="text" placeholder="Optional note" />
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
              {fetcher.state === 'idle' ? 'Refund' : 'Refunding…'}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  )
}
