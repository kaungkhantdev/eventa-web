import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import {
  PageFooter,
  HeaderUser,
  Button,
  Card,
  Icon,
  PillTabs,
  Paginator,
  usePagination,
  EventPicker,
  type PillTabItem,
} from '@/components/ui'
import type { AdminOutletContext } from '@/layouts/AdminShell'
import { useDisclosure } from '@/lib/useDisclosure'
import { cn } from '@/lib/cn'
import {
  INVOICES,
  INVOICE_STATUS_BADGE,
  type Invoice,
  type InvoiceStatus,
  statusOf,
  shortD,
  ageText,
  payText,
  fmtBaht,
} from '../data/invoices'
import { downloadInvoicePDF } from '../lib/invoicePdf'

type InvTab = 'all' | InvoiceStatus

export default function InvoicesPage() {
  const ctx = useOutletContext<AdminOutletContext | null>()
  const modal = useDisclosure()
  const [selected, setSelected] = useState<Invoice | null>(null)

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<InvTab>('all')
  const [eventFilter, setEventFilter] = useState('All events')

  // status tab counts, computed from the data
  const counts = useMemo(() => {
    const base = { all: INVOICES.length, Paid: 0, Issued: 0, Overdue: 0, Void: 0 }
    for (const iv of INVOICES) base[statusOf(iv)]++
    return base
  }, [])

  const tabs: PillTabItem<InvTab>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'Paid', label: 'Paid', count: counts.Paid },
    { value: 'Issued', label: 'Issued', count: counts.Issued },
    { value: 'Overdue', label: 'Overdue', count: counts.Overdue },
    { value: 'Void', label: 'Void', count: counts.Void },
  ]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const evAll = !eventFilter || /all events/i.test(eventFilter)
    return INVOICES.filter((iv) => {
      const matchesQ =
        !query || iv.no.toLowerCase().includes(query) || iv.buyer.toLowerCase().includes(query)
      const matchesEvent = evAll || iv.ev === eventFilter
      const matchesStatus = tab === 'all' || statusOf(iv) === tab
      return matchesQ && matchesEvent && matchesStatus
    })
  }, [q, tab, eventFilter])

  const pager = usePagination(filtered)
  const { setPage } = pager
  useEffect(() => setPage(1), [q, tab, eventFilter, setPage])

  function openInvoice(iv: Invoice) {
    setSelected(iv)
    modal.onOpen()
  }

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
            <h1 className="text-[22px] font-bold tracking-tight">Invoices</h1>
            <p className="mt-0.5 hidden text-[12px] text-muted sm:block">
              Bills issued to buyers — who still owes you. Looking for a charge or refund?{' '}
              <Link to="/admin/payments" className="font-medium text-brand hover:underline">
                See Payments
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <Icon name="hgi-download-01" size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="ghost">
            <Icon name="hgi-refresh" size={16} />
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
            placeholder="Search invoice no. or buyer…"
            className="h-10 w-full rounded-lg bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <EventPicker
            value={eventFilter}
            onChange={setEventFilter}
            className="h-10 w-full border-0 bg-surface text-[14px] font-semibold"
          />
        </div>
      </div>

      {/* table */}
      <Card className="mt-3 p-4">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[860px]">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Buyer</th>
                <th>Event</th>
                <th className="text-right">Amount</th>
                <th>Due</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {pager.slice.map((iv) => {
                const st = statusOf(iv)
                const s = INVOICE_STATUS_BADGE[st]
                const age = ageText(iv)
                const ageCls = st === 'Overdue' ? 'text-red-500' : 'text-muted'
                return (
                  <tr key={iv.no}>
                    <td className="whitespace-nowrap font-mono text-[12.5px] font-semibold text-ink">
                      {iv.no}
                    </td>
                    <td className="font-medium text-ink">{iv.buyer}</td>
                    <td className="text-muted">{iv.ev}</td>
                    <td className="text-right font-semibold text-ink tnum">{fmtBaht(iv.amt)}</td>
                    <td className="whitespace-nowrap">
                      <span className="text-ink tnum">{shortD(iv.due)}</span>
                      {age && (
                        <span className={cn('ml-1.5 text-[11px] font-medium', ageCls)}>{age}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className={s.cls}>
                          <i className={cn('hgi-stroke', s.icon, 'text-[12px]')} />
                          {st}
                        </span>
                        {st === 'Paid' && (
                          <span className="text-[11px] text-muted">{payText(iv)}</span>
                        )}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-icon"
                          title="View invoice"
                          onClick={() => openInvoice(iv)}
                        >
                          <i className="hgi-stroke hgi-view text-[16px]" />
                        </button>
                        <button
                          className="btn-icon"
                          title="Download PDF"
                          onClick={() => downloadInvoicePDF(iv)}
                        >
                          <i className="hgi-stroke hgi-download-01 text-[16px]" />
                        </button>
                        <button className="btn-icon" title="Resend to buyer">
                          <i className="hgi-stroke hgi-mail-01 text-[16px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pager.total === 0 && (
          <p className="py-8 text-center text-[13px] text-muted">No invoices match your filters.</p>
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
          noun="invoices"
        />
      </Card>

      <PageFooter />

      {/* Invoice detail modal */}
      <InvoiceModal open={modal.open} onClose={modal.onClose} iv={selected} />
    </>
  )
}

/* Invoice detail — figures derive from the invoice's own amount (VAT-inclusive),
   so subtotal + 7% VAT always equals the total shown in the row. */
function InvoiceModal({
  open,
  onClose,
  iv,
}: {
  open: boolean
  onClose: () => void
  iv: Invoice | null
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const sub = iv ? Math.round(iv.amt / 1.07) : 0
  const vat = iv ? iv.amt - sub : 0
  const st = iv ? statusOf(iv) : 'Issued'
  const s = INVOICE_STATUS_BADGE[st]
  const dueText = iv ? iv.due + (ageText(iv) ? ' · ' + ageText(iv) : '') : '—'

  return (
    <>
      <div className={cn('panel-overlay', open && 'open')} onClick={onClose} />
      <div className={cn('modal', open && 'open')} role="dialog" aria-modal="true">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <i className="hgi-stroke hgi-invoice-01 text-[20px]" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold tracking-tight">
                  Invoice <span className="font-mono">{iv?.no ?? '—'}</span>
                </h3>
                <p className="truncate text-[12px] text-muted">
                  Order <span className="font-mono text-ink">{iv?.ref ?? '—'}</span>
                </p>
              </div>
            </div>
            <span className={cn(s.cls, 'shrink-0')}>
              <i className={cn('hgi-stroke', s.icon, 'text-[12px]')} />
              {st}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-hair p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Billed to</p>
            <p className="mt-1 text-[14px] font-semibold text-ink">{iv?.buyer ?? '—'}</p>
            <p className="truncate text-[12px] text-muted">{iv?.sub ?? '—'}</p>
          </div>

          <div className="mt-3 rounded-xl border border-hair">
            <div className="flex items-center justify-between gap-3 border-b border-line p-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">Event ticket</p>
                <p className="truncate text-[11px] text-muted">{iv?.ev ?? '—'}</p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-ink tnum">
                {iv ? fmtBaht(iv.amt) : '—'}
              </span>
            </div>
            <div className="space-y-1.5 p-3 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal (excl. VAT)</span>
                <span className="text-ink tnum">{iv ? fmtBaht(sub) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">VAT 7%</span>
                <span className="text-ink tnum">{iv ? fmtBaht(vat) : '—'}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-line pt-2">
                <span className="font-semibold text-ink">Total</span>
                <span className="text-[14px] font-bold text-ink tnum">
                  {iv ? fmtBaht(iv.amt) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-[11px] text-muted">
            <div className="flex justify-between gap-3">
              <span>Issued</span>
              <span className="text-ink">{iv?.issued ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Due</span>
              <span className="text-ink">{dueText}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Payment</span>
              <span className="text-ink">{iv ? payText(iv) : '—'}</span>
            </div>
          </div>

          <div className="mt-4">
            <button className="btn btn-soft w-full" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
