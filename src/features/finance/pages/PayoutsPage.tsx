import { useMemo, useState } from 'react'
import {
  PageHeader,
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  Panel,
  PillTabs,
  Paginator,
  usePagination,
  type PillTabItem,
} from '@/components/ui'
import { useDisclosure } from '@/lib/useDisclosure'
import { baht } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  PAYOUTS,
  PAYOUT_STATUS_BADGE,
  PAYOUT_TAB_STATUS,
  PAYOUT_NOTE,
  type Payout,
  type PayoutStatus,
  type PayoutTab,
} from '../data/payouts'

type TimelineStep = { icon: string; color: string; label: string; date: string }

/** Timeline rows shown in the detail slide-over, keyed on payout status. */
function timelineSteps(p: Payout): TimelineStep[] {
  const done = 'text-brand'
  const cur = 'text-blue-500'
  const pend = 'text-muted/40'
  const fail = 'text-red-500'
  if (p.status === 'Paid')
    return [
      { icon: 'hgi-checkmark-circle-02', color: done, label: 'Requested', date: p.requested },
      { icon: 'hgi-checkmark-circle-02', color: done, label: 'Processing', date: 'Completed' },
      { icon: 'hgi-checkmark-circle-02', color: done, label: 'Paid', date: p.completed },
    ]
  if (p.status === 'Processing')
    return [
      { icon: 'hgi-checkmark-circle-02', color: done, label: 'Requested', date: p.requested },
      { icon: 'hgi-loading-03', color: cur, label: 'Processing', date: 'In progress' },
      { icon: 'hgi-circle', color: pend, label: 'Paid', date: 'Pending' },
    ]
  if (p.status === 'Scheduled')
    return [
      { icon: 'hgi-time-quarter-pass', color: cur, label: 'Scheduled', date: p.requested },
      { icon: 'hgi-circle', color: pend, label: 'Processing', date: 'Pending' },
      { icon: 'hgi-circle', color: pend, label: 'Paid', date: 'Pending' },
    ]
  return [
    { icon: 'hgi-checkmark-circle-02', color: done, label: 'Requested', date: p.requested },
    { icon: 'hgi-cancel-circle', color: fail, label: 'Failed', date: 'Payment returned' },
  ]
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  return <span className={cn('badge', PAYOUT_STATUS_BADGE[status])}>{status}</span>
}

export default function PayoutsPage() {
  const stripePanel = useDisclosure()
  const view = useDisclosure()
  const [sel, setSel] = useState<Payout | null>(null)

  const [tab, setTab] = useState<PayoutTab>('all')

  const counts = useMemo(
    () => ({
      all: PAYOUTS.length,
      paid: PAYOUTS.filter((p) => p.status === 'Paid').length,
      processing: PAYOUTS.filter((p) => p.status === 'Processing').length,
      scheduled: PAYOUTS.filter((p) => p.status === 'Scheduled').length,
      failed: PAYOUTS.filter((p) => p.status === 'Failed').length,
    }),
    [],
  )

  const tabs: PillTabItem<PayoutTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'paid', label: 'Paid', count: counts.paid },
    { value: 'processing', label: 'Processing', count: counts.processing },
    { value: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { value: 'failed', label: 'Failed', count: counts.failed },
  ]

  const filtered = useMemo(
    () => PAYOUTS.filter((p) => tab === 'all' || p.status === PAYOUT_TAB_STATUS[tab]),
    [tab],
  )

  const pager = usePagination(filtered)
  const { setPage } = pager

  const changeTab = (t: PayoutTab) => {
    setTab(t)
    setPage(1)
  }

  const openView = (p: Payout) => {
    setSel(p)
    view.onOpen()
  }

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="Track your balance and payout history — payouts run securely on Stripe."
        actions={
          <>
            <Button variant="primary" className="shrink-0" onClick={stripePanel.onOpen}>
              <Icon name="hgi-link-square-02" />
              <span className="hidden sm:inline">Manage on Stripe</span>
              <span className="sm:hidden">Stripe</span>
            </Button>
            <HeaderUser />
          </>
        }
      />

      {/* balance summary row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
            Available balance
          </div>
          <p className="mt-2 text-[26px] font-extrabold tracking-tight tnum">฿3.19M</p>
          <Button variant="primary" className="mt-3 w-full" onClick={stripePanel.onOpen}>
            <Icon name="hgi-link-square-02" />
            Manage payouts on Stripe
          </Button>
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted">
            <i className="hgi-stroke hgi-security-lock text-[12px]" />
            Payouts handled securely by Stripe
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-clock-01 text-[16px]" />
            Pending
          </div>
          <p className="mt-2 text-[26px] font-extrabold tracking-tight tnum">฿120k</p>
          <p className="mt-3 text-[12px] text-muted">1 payout processing</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <i className="hgi-stroke hgi-checkmark-badge-01 text-[16px]" />
            Paid out (all time)
          </div>
          <p className="mt-2 text-[26px] font-extrabold tracking-tight tnum">฿12.4M</p>
          <p className="mt-3 text-[12px] text-muted">Across 41 payouts</p>
        </Card>
      </div>

      {/* payouts history */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold tracking-tight">Payouts History</h2>
        <span className="text-[12px] text-muted">Last 90 days</span>
      </div>
      <PillTabs items={tabs} value={tab} onChange={changeTab} className="mt-2" />

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Payout</th>
                <th>Amount</th>
                <th>Bank account</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Completed</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.length ? (
                pager.slice.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-[12px] text-ink">{p.id}</td>
                    <td className="font-semibold text-ink tnum">{baht(p.amount)}</td>
                    <td className="text-muted">{p.bank}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-muted tnum">{p.requested}</td>
                    <td className="text-muted tnum">{p.completed}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-icon"
                        title="View"
                        onClick={() => openView(p)}
                      >
                        <i className="hgi-stroke hgi-eye text-[16px]" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="py-10 text-center text-[13px] text-muted">No matches.</div>
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
          noun="payouts"
        />
      </Card>

      <PageFooter />

      {/* Manage payouts — Stripe explainer slide-over */}
      <Panel
        open={stripePanel.open}
        onClose={stripePanel.onClose}
        title="Manage payouts"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={stripePanel.onClose}>
              Close
            </Button>
            <Button variant="primary" className="flex-1" onClick={stripePanel.onClose}>
              <Icon name="hgi-link-square-02" />
              Continue to Stripe
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-xl border border-hair bg-canvas p-5 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
              <i className="hgi-stroke hgi-shield-key text-[24px]" />
            </span>
            <h4 className="mt-3 text-[15px] font-bold tracking-tight">
              Payouts are handled by Stripe
            </h4>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              Your balance, bank account, tax details and payout schedule are managed securely in
              your Stripe dashboard. Eventa never stores your bank or card details.
            </p>
          </div>
          <div className="card p-3.5">
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <i className="hgi-stroke hgi-wallet-01 text-[16px]" />
              Available balance
            </div>
            <p className="mt-1 text-[22px] font-bold tracking-tight tnum">฿3.19M</p>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              On Stripe you can
            </p>
            <ul className="space-y-2 text-[13px] text-ink">
              <li className="flex items-center gap-2.5">
                <i className="hgi-stroke hgi-flash text-[16px] text-brand" />
                Request an instant payout
              </li>
              <li className="flex items-center gap-2.5">
                <i className="hgi-stroke hgi-bank text-[16px] text-brand" />
                Update your bank account
              </li>
              <li className="flex items-center gap-2.5">
                <i className="hgi-stroke hgi-calendar-03 text-[16px] text-brand" />
                Set your payout schedule
              </li>
              <li className="flex items-center gap-2.5">
                <i className="hgi-stroke hgi-invoice-01 text-[16px] text-brand" />
                Download tax forms &amp; statements
              </li>
            </ul>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-hair bg-canvas p-3">
            <i className="hgi-stroke hgi-security-lock mt-0.5 text-[16px] text-muted" />
            <p className="text-[12px] text-muted">
              You'll be redirected to Stripe's secure dashboard. Eventa is PCI-compliant and never
              sees your bank or card numbers.
            </p>
          </div>
        </div>
      </Panel>

      {/* Payout detail slide-over */}
      <Panel
        open={view.open}
        onClose={view.onClose}
        title="Payout details"
        footer={
          <>
            <Button variant="soft" className="flex-1" onClick={view.onClose}>
              Close
            </Button>
            {sel?.status === 'Failed' && (
              <Button variant="primary" className="flex-1">
                <Icon name="hgi-refresh" />
                Retry payout
              </Button>
            )}
            {sel?.status === 'Paid' && (
              <Button variant="primary" className="flex-1">
                <Icon name="hgi-download-01" />
                Download receipt
              </Button>
            )}
          </>
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="card p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[12px] text-muted">
                  <i className="hgi-stroke hgi-money-send-01 text-[16px]" />
                  Payout amount
                </div>
                <StatusBadge status={sel.status} />
              </div>
              <p className="mt-1.5 text-[24px] font-bold tracking-tight tnum">{baht(sel.amount)}</p>
              <p className="font-mono text-[12px] text-muted">{sel.id}</p>
            </div>

            <dl className="overflow-hidden rounded-lg border border-hair">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <dt className="text-[12px] text-muted">Bank account</dt>
                <dd className="text-[13px] font-medium text-ink tnum">{sel.bank}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <dt className="text-[12px] text-muted">Requested</dt>
                <dd className="text-[13px] text-ink tnum">{sel.requested}</dd>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <dt className="text-[12px] text-muted">Completed</dt>
                <dd className="text-[13px] text-ink tnum">{sel.completed}</dd>
              </div>
            </dl>

            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Timeline
              </p>
              <div className="space-y-3">
                {timelineSteps(sel).map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <i className={cn('hgi-stroke', step.icon, step.color, 'text-[16px]')} />
                    <p className="min-w-0 flex-1 text-[13px] font-medium text-ink">{step.label}</p>
                    <span className="text-[11px] text-muted tnum">{step.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-hair bg-canvas p-3">
              <i className="hgi-stroke hgi-information-circle mt-0.5 text-[16px] text-muted" />
              <p className="text-[12px] text-muted">{PAYOUT_NOTE[sel.status]}</p>
            </div>
          </div>
        )}
      </Panel>
    </>
  )
}
