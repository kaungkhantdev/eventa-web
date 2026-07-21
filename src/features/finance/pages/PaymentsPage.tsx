import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import {
  PageFooter,
  HeaderUser,
  Button,
  Icon,
  Card,
  PillTabs,
  Paginator,
  usePagination,
  type PillTabItem,
} from '@/components/ui'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { useDisclosure } from '@/lib/useDisclosure'
import { baht } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  PAYMENTS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_METHOD_BADGE,
  PAYMENT_TAB_STATUS,
  PAYMENT_METHODS,
  type Payment,
  type PaymentTab,
} from '../data/payments'

export default function PaymentsPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<PaymentTab>('all')
  const [method, setMethod] = useState('')

  const refund = useDisclosure()
  const [refundSel, setRefundSel] = useState<Payment | null>(null)
  const invoice = useDisclosure()
  const [invoiceSel, setInvoiceSel] = useState<Payment | null>(null)

  const counts = useMemo(
    () => ({
      all: PAYMENTS.length,
      paid: PAYMENTS.filter((p) => p.st === 'Paid').length,
      pending: PAYMENTS.filter((p) => p.st === 'Pending').length,
      refunded: PAYMENTS.filter((p) => p.st === 'Refunded').length,
      failed: PAYMENTS.filter((p) => p.st === 'Failed').length,
    }),
    [],
  )

  const tabs: PillTabItem<PaymentTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'paid', label: 'Paid', count: counts.paid },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'refunded', label: 'Refunded', count: counts.refunded },
    { value: 'failed', label: 'Failed', count: counts.failed },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const status = tab === 'all' ? '' : PAYMENT_TAB_STATUS[tab]
    return PAYMENTS.filter((p) => {
      const matchesQ =
        !query || p.txn.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
      const matchesMethod = !method || p.method === method
      const matchesStatus = !status || p.st === status
      return matchesQ && matchesMethod && matchesStatus
    })
  }, [q, tab, method])

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [q, tab, method, setPage])

  const openRefund = (p: Payment) => {
    setRefundSel(p)
    refund.onOpen()
  }
  const openInvoice = (p: Payment) => {
    setInvoiceSel(p)
    invoice.onOpen()
  }

  // Invoice figures derived from the transaction: subtotal = total / 1.07, VAT
  // is the remainder — so subtotal + VAT reconciles to the amount charged.
  const invSub = invoiceSel ? Math.round(invoiceSel.amt / 1.07) : 0
  const invVat = invoiceSel ? invoiceSel.amt - invSub : 0
  const invVoided = invoiceSel?.st === 'Refunded'

  return (
    <>
      {/* header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => ctx?.openDrawer()}
            title="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted hover:text-ink lg:hidden"
          >
            <Icon name="hgi-menu-01" size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-tight">Payments</h1>
            <p className="mt-0.5 hidden text-[12px] text-muted sm:block">
              Every charge, refund and failed attempt. Chasing an unpaid bill?{' '}
              <Link to="/admin/invoices" className="font-medium text-brand hover:underline">
                See Invoices
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <Icon name="hgi-download-01" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="ghost">
            <Icon name="hgi-refresh" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <HeaderUser />
        </div>
      </div>

      {/* pill tabs (out of table) */}
      <PillTabs items={tabs} value={tab} onChange={setTab} />

      {/* search + filter (out of table) */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full flex-1">
          <i className="hgi-stroke hgi-search-01 text-[16px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transaction or attendee…"
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <i className="hgi-stroke hgi-wallet-01 text-[15px] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="select h-10 w-full border-0 bg-surface pl-9 font-medium"
          >
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
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
              {pager.slice.map((p) => {
                const s = PAYMENT_STATUS_BADGE[p.st]
                const m = PAYMENT_METHOD_BADGE[p.method]
                const refundable = p.st === 'Paid'
                const invoiced = p.st === 'Paid' || p.st === 'Refunded'
                return (
                  <tr key={p.txn}>
                    <td>
                      <p className="font-mono text-[12.5px] font-semibold text-ink">{p.txn}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{p.date}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar h-7 w-7 text-[10px]">{p.ini}</span>
                        <span className="font-medium text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{p.ev}</td>
                    <td>
                      <span className={m.cls}>
                        <i className={cn('hgi-stroke', m.icon, 'text-[12px]')} />
                        {p.method}
                      </span>
                    </td>
                    <td className="font-semibold text-ink tnum">{baht(p.amt)}</td>
                    <td>
                      <span className={s.cls}>
                        <i className={cn('hgi-stroke', s.icon, 'text-[12px]')} />
                        {p.st}
                      </span>
                    </td>
                    <td className="text-muted tnum">{p.time}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {invoiced ? (
                          <button
                            type="button"
                            className="btn-icon"
                            title="View invoice"
                            onClick={() => openInvoice(p)}
                          >
                            <i className="hgi-stroke hgi-invoice-01 text-[16px]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-icon cursor-not-allowed opacity-30"
                            disabled
                            title="No invoice — payment not completed"
                          >
                            <i className="hgi-stroke hgi-invoice-01 text-[16px]" />
                          </button>
                        )}
                        {refundable ? (
                          <button
                            type="button"
                            className="btn-icon"
                            title="Refund"
                            onClick={() => openRefund(p)}
                          >
                            <i className="hgi-stroke hgi-delivery-return-01 text-[16px]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-icon cursor-not-allowed opacity-30"
                            disabled
                            title="Not eligible for refund"
                          >
                            <i className="hgi-stroke hgi-delivery-return-01 text-[16px]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pager.total === 0 && (
          <p className="py-8 text-center text-[13px] text-muted">
            No transactions match your filters.
          </p>
        )}

        <Paginator
          from={pager.from}
          to={pager.to}
          total={pager.total}
          page={pager.page}
          pageCount={pager.pageCount}
          size={pager.size}
          onPage={pager.setPage}
          onSize={pager.setSize}
          noun="transactions"
        />
      </Card>

      <PageFooter />

      {/* Invoice preview — figures reconcile with the payment's amount. */}
      <div className={cn('panel-overlay', invoice.open && 'open')} onClick={invoice.onClose} />
      <div className={cn('modal', invoice.open && 'open')} role="dialog" aria-modal="true">
        {invoiceSel && (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <i className="hgi-stroke hgi-invoice-01 text-[20px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold tracking-tight">
                    Invoice{' '}
                    <span className="font-mono">
                      {'#INV-' + invoiceSel.txn.replace(/\D/g, '')}
                    </span>
                  </h3>
                  <p className="truncate text-[12px] text-muted">
                    For transaction <span className="font-mono text-ink">{invoiceSel.txn}</span>
                  </p>
                </div>
              </div>
              <span
                className={cn('badge shrink-0', invVoided ? 'badge-gray' : 'badge-green')}
              >
                {invVoided ? 'Void' : 'Paid'}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-hair p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Billed to
              </p>
              <p className="mt-1 text-[14px] font-semibold text-ink">{invoiceSel.name}</p>
              <p className="text-[12px] text-muted">{invoiceSel.ev}</p>
            </div>

            <div className="mt-3 rounded-xl border border-hair">
              <div className="flex items-center justify-between gap-3 border-b border-line p-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">Event ticket</p>
                  <p className="truncate text-[11px] text-muted">{invoiceSel.ev}</p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold text-ink tnum">
                  {baht(invoiceSel.amt)}
                </span>
              </div>
              <div className="space-y-1.5 p-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal (excl. VAT)</span>
                  <span className="text-ink tnum">{baht(invSub)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">VAT 7%</span>
                  <span className="text-ink tnum">{baht(invVat)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-line pt-2">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="text-[14px] font-bold text-ink tnum">{baht(invoiceSel.amt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
              <span>
                Issued <span className="text-ink">{invoiceSel.date}</span>
              </span>
              <span>
                Paid via <span className="text-ink">{invoiceSel.method}</span>
              </span>
            </div>

            <div className="mt-4">
              <button type="button" className="btn btn-soft w-full" onClick={invoice.onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund confirm modal */}
      <div className={cn('panel-overlay', refund.open && 'open')} onClick={refund.onClose} />
      <div className={cn('modal', refund.open && 'open')} role="dialog" aria-modal="true">
        {refundSel && (
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300">
                <i className="hgi-stroke hgi-alert-01 text-[20px]" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold tracking-tight">Refund transaction</h3>
                <p className="truncate text-[12px] text-muted">
                  Transaction <span className="font-mono text-ink">{refundSel.txn}</span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-muted">
              This will refund{' '}
              <span className="font-semibold text-ink tnum">{baht(refundSel.amt)}</span> to the
              attendee's original payment method. Their ticket will be cancelled and this action
              cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-soft flex-1" onClick={refund.onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger flex-1" onClick={refund.onClose}>
                Refund {baht(refundSel.amt)}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
