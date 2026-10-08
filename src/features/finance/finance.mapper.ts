import type { BadgeTone } from '@/components/ui'
import { MASKED, baht, bangkokDate } from '@/lib/format'
import type {
  BalancesWire,
  InvoiceRow,
  InvoiceStatus,
  InvoiceWire,
  PayoutRow,
  PayoutStatus,
  PayoutWire,
  TaxPeriodWire,
  TaxRow,
  TaxStatus,
} from './finance.types'

/** The rules behind payouts, invoices and VAT (US-FIN-03..12). */

const SATANG_PER_BAHT = 100

/**
 * Money that moved, or a figure being withheld.
 *
 * Deliberately not `satang()`: that one renders 0 as "Free", which is right for
 * a ticket price and wrong for everything here. A payout of nothing, a balance
 * of nothing and a month with no VAT are all ฿0 — a real figure. Null still
 * means "not disclosed", and still renders as a dash.
 */
function amount(satang: number | null): string {
  if (satang === null) return MASKED
  return baht(Math.round(satang / SATANG_PER_BAHT))
}

/* ── payouts ──────────────────────────────────────────────────────────── */

const PAYOUT_META: Record<PayoutStatus, { label: string; tone: BadgeTone; icon: string }> = {
  scheduled: { label: 'Scheduled', tone: 'blue', icon: 'hgi-time-schedule' },
  processing: { label: 'Processing', tone: 'amber', icon: 'hgi-clock-01' },
  paid: { label: 'Paid', tone: 'green', icon: 'hgi-checkmark-badge-01' },
  failed: { label: 'Failed', tone: 'red', icon: 'hgi-alert-circle' },
}

export function toPayoutRow(wire: PayoutWire): PayoutRow {
  const meta = PAYOUT_META[wire.status]
  return {
    reference: wire.reference,
    amount: amount(wire.amountSatang),
    // Already masked by the API — Eventa never stores a bank account number.
    bankAccount: wire.bankAccount,
    status: wire.status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusIcon: meta.icon,
    period: wire.periodCovered ?? MASKED,
    requested: bangkokDate(wire.requestedAt),
    completed: bangkokDate(wire.completedAt),
    failureReason: wire.failureReason,
    canRetry: wire.canRetry,
  }
}

export interface Balances {
  available: string
  pending: string
  paidOut: string
  /** False until a payout account exists; every figure is masked until then. */
  connected: boolean
}

/**
 * The three headline balances (US-FIN-03).
 *
 * Every figure is null until an account is connected — the provider holds the
 * money and has not been asked. Rendering that as ฿0 would tell an organizer
 * they have earned nothing, which is a different and alarming claim.
 */
export function toBalances(wire: BalancesWire): Balances {
  return {
    available: amount(wire.availableSatang),
    pending: amount(wire.pendingSatang),
    paidOut: amount(wire.paidOutSatang),
    connected: wire.payoutsConnected,
  }
}

/* ── invoices ─────────────────────────────────────────────────────────── */

const INVOICE_META: Record<InvoiceStatus, { label: string; tone: BadgeTone; icon: string }> = {
  issued: { label: 'Issued', tone: 'blue', icon: 'hgi-invoice-01' },
  paid: { label: 'Paid', tone: 'green', icon: 'hgi-checkmark-badge-01' },
  overdue: { label: 'Overdue', tone: 'red', icon: 'hgi-alert-circle' },
  void: { label: 'Void', tone: 'gray', icon: 'hgi-cancel-circle' },
}

export function toInvoiceRow(wire: InvoiceWire): InvoiceRow {
  const meta = INVOICE_META[wire.status]
  return {
    id: wire.id,
    number: wire.number,
    event: wire.eventName,
    buyer: wire.buyerName,
    buyerEmail: wire.buyerEmail,
    amount: amount(wire.amountSatang),
    vat: amount(wire.vatAmountSatang),
    issued: bangkokDate(wire.issuedAt),
    due: bangkokDate(wire.dueAt),
    dueNote: dueNote(wire),
    status: wire.status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusIcon: meta.icon,
    canVoid: wire.canVoid,
    voidBlockedReason: wire.voidBlockedReason,
  }
}

/**
 * How the due date reads.
 *
 * A settled or voided invoice stops counting — its deadline is history. An
 * overdue one says how late it is, because "Due in -3 days" is arithmetic
 * leaking onto a screen somebody is using to chase a payment.
 */
function dueNote(wire: InvoiceWire): string {
  if (wire.status === 'paid') return 'Paid'
  if (wire.status === 'void') return 'Void'
  const days = wire.daysUntilDue
  if (days < 0) return `Overdue by ${Math.abs(days)} ${plural(Math.abs(days), 'day')}`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

function plural(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`
}

/* ── VAT ──────────────────────────────────────────────────────────────── */

const TAX_META: Record<TaxStatus, { label: string; tone: BadgeTone; icon: string }> = {
  upcoming: { label: 'Upcoming', tone: 'gray', icon: 'hgi-time-schedule' },
  due: { label: 'Due', tone: 'amber', icon: 'hgi-clock-01' },
  filed: { label: 'Filed', tone: 'green', icon: 'hgi-checkmark-badge-01' },
}

export function toTaxRow(wire: TaxPeriodWire): TaxRow {
  const meta = TAX_META[wire.status]
  return {
    // Two years both have a July; the month alone is not a key.
    key: `${wire.year}-${wire.month}`,
    year: wire.year,
    month: wire.month,
    period: wire.period,
    due: bangkokDate(wire.dueAt),
    sales: amount(wire.salesSatang),
    vat: amount(wire.vatSatang),
    withholding: amount(wire.whtSatang),
    remitted: amount(wire.remittedSatang),
    status: wire.status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusIcon: meta.icon,
    // Recorded rather than hidden: the Revenue Department's surcharge depends
    // on it, and the organizer is the one who will be asked about it.
    lateNote: wire.late ? 'Filed late' : null,
    canFile: wire.canFile,
  }
}
