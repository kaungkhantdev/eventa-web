import { useEffect } from 'react'
import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  HeaderUser,
  Icon,
  PageFooter,
  PageHeader,
  Paginator,
  PillTabs,
  type PillTabItem,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useFilters } from '@/lib/useFilters'
import { useIsFiltering } from '@/lib/usePendingPath'
import type { ActionResult } from '@/app/loaders'
import type { PayoutTab, PayoutsData } from '../finance.routes'
import type { PayoutRow } from '../finance.types'

/**
 * Payouts to the organizer's bank (US-FIN-03..05). Ported from payouts.html.
 *
 * Every balance is masked until a payout account is connected. The provider
 * holds the money and has not been asked — "฿0" would tell an organizer they
 * have earned nothing, which is a different and alarming claim.
 */

const TABS: PillTabItem<PayoutTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
]

export default function PayoutsPage() {
  const data = useLoaderData() as PayoutsData
  const { params, set } = useFilters()
  const filtering = useIsFiltering()
  const connect = useFetcher<ActionResult & { url?: string | null }>()

  // The provider's settings URL is one-time; follow it as soon as it arrives.
  useEffect(() => {
    const url = connect.data && 'url' in connect.data ? connect.data.url : null
    if (url) window.location.assign(url)
  }, [connect.data])

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="Money on its way to your bank account."
        actions={<HeaderUser />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BalanceTile label="Available" value={data.balances.available} icon="hgi-wallet-01" />
        <BalanceTile label="Pending" value={data.balances.pending} icon="hgi-time-quarter-pass" />
        <BalanceTile label="Paid out" value={data.balances.paidOut} icon="hgi-bank" />
      </div>

      {!data.balances.connected && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-400/10">
          <Icon name="hgi-alert-circle" size={18} className="text-amber-500" />
          <p className="flex-1 text-[13px] text-ink">
            Connect a payout account to receive the money from your ticket sales.
          </p>
          <connect.Form method="post">
            <input type="hidden" name="intent" value="connect" />
            <Button variant="primary" type="submit" disabled={connect.state !== 'idle'}>
              {connect.state === 'idle' ? 'Connect account' : 'Opening…'}
            </Button>
          </connect.Form>
        </div>
      )}

      <div className="mt-3">
        <PillTabs<PayoutTab>
          items={TABS}
          value={(params.get('tab') as PayoutTab) ?? 'all'}
          onChange={(tab) => set({ tab: tab === 'all' ? null : tab })}
        />
      </div>

      <div className={cn('mt-3', filtering && 'opacity-60 transition-opacity')}>
        <Card className="p-4">
          <div className="overflow-x-auto">
            <DataTable className="min-w-[880px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Period</th>
                  <th>Bank account</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Completed</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {data.rows.map((row) => (
                  <PayoutTableRow key={row.reference} row={row} />
                ))}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="py-10 text-center text-[13px] text-muted">
                        No payouts yet.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </div>

          <Paginator
            {...data.window}
            noun="payouts"
            onPage={(page) => set({ page })}
            onSize={(size) => set({ limit: size, page: null })}
          />
        </Card>
      </div>

      <PageFooter />
    </>
  )
}

function BalanceTile({ label, value, icon }: { label: string; value: string; icon: string }) {
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

function PayoutTableRow({ row }: { row: PayoutRow }) {
  const retry = useFetcher<ActionResult>()

  return (
    <tr>
      <td className="tnum font-medium text-ink">{row.reference}</td>
      <td className="text-muted">{row.period}</td>
      <td className="tnum text-muted">{row.bankAccount}</td>
      <td className="tnum font-semibold text-ink">{row.amount}</td>
      <td>
        <Badge tone={row.statusTone}>{row.statusLabel}</Badge>
        {row.failureReason && (
          <p role="alert" className="mt-1 text-[11px] text-red-500">
            {row.failureReason}
          </p>
        )}
      </td>
      <td className="tnum text-muted">{row.requested}</td>
      <td className="tnum text-muted">{row.completed}</td>
      <td className="text-right">
        {row.canRetry && (
          <retry.Form method="post" className="inline">
            <input type="hidden" name="reference" value={row.reference} />
            <button
              type="submit"
              className="btn-icon"
              title="Retry payout"
              disabled={retry.state !== 'idle'}
            >
              <Icon name="hgi-refresh" size={16} />
            </button>
          </retry.Form>
        )}
      </td>
    </tr>
  )
}
