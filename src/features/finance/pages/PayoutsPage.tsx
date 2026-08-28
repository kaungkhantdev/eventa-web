import { useFetcher, useLoaderData } from 'react-router'
import {
  Badge,
  ButtonLink,
  Card,
  DataTable,
  EmptyState,
  HeaderUser,
  Icon,
  NoResults,
  PageFooter,
  PageHeader,
  Paginator,
  PastEnd,
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

/**
 * Where connecting a payout account actually happens.
 *
 * Not a `POST /payouts/settings-link` from here, which is what this page used
 * to offer: for an unconnected workspace that endpoint answers
 * `{connected:false, url:null}` — there is no provider URL to follow in exactly
 * the case the button is shown — and `pageAction` returns `{ok:true}` for
 * anything that is not a `Response`, so the link would never reach the page
 * even when the provider had one. A plain link, as in the kit (payouts.html).
 */
const PAYOUT_SETTINGS = '/admin/settings-payments'

export default function PayoutsPage() {
  const data = useLoaderData() as PayoutsData
  const { params, set, clear, emptyReason } = useFilters({ total: data.window.total })
  const filtering = useIsFiltering()

  const header = (
    <PageHeader
      title="Payouts"
      subtitle="Money on its way to your bank account."
      actions={<HeaderUser />}
    />
  )

  /* Nothing has been paid out *and* no account is connected, so every balance
     above is masked: three dashes over an empty table is a page with nothing on
     it. Once an account exists the balances are real figures worth showing, even
     before the first transfer — so that case keeps the tiles and answers inside
     the table instead. */
  if (data.rows.length === 0 && emptyReason === 'first-run' && !data.balances.connected) {
    return (
      <>
        {header}

        <Card>
          <EmptyState
            icon="hgi-bank"
            title="No payouts yet"
            actions={[
              {
                label: 'Connect a payout account',
                to: PAYOUT_SETTINGS,
                icon: 'hgi-link-square-02',
              },
              { label: 'Create your first event', to: '/admin/event-form' },
            ]}
          >
            A payout moves your ticket sales from Eventa to your bank. Connect a payout account
            first — after that your balance builds up as tickets sell, and every transfer is listed
            here.
          </EmptyState>
        </Card>

        <PageFooter />
      </>
    )
  }

  return (
    <>
      {header}

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
          <ButtonLink variant="primary" to={PAYOUT_SETTINGS}>
            Connect account
          </ButtonLink>
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
                      {emptyReason === 'past-end' ? (
                        <PastEnd noun="payouts" onFirstPage={clear} />
                      ) : emptyReason === 'no-results' ? (
                        <NoResults noun="payouts" onClear={clear}>
                          Nothing matches the current status tab. Try widening it to see more
                          payouts.
                        </NoResults>
                      ) : (
                        // The account is connected — the balances above are real
                        // figures — but no transfer has been made yet.
                        <EmptyState compact icon="hgi-bank" title="No payouts yet">
                          Your available balance is transferred to your bank on a schedule. The
                          first payout will be listed here once it is on its way.
                        </EmptyState>
                      )}
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
        <Badge tone={row.statusTone} icon={row.statusIcon}>
          {row.statusLabel}
        </Badge>
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
