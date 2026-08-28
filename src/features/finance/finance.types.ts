import type { BadgeTone } from '@/components/ui'

/** Payouts, invoices and VAT periods (US-FIN-03..12). */

/* ── payouts ──────────────────────────────────────────────────────────── */

export type PayoutStatus = 'scheduled' | 'processing' | 'paid' | 'failed'

export interface PayoutWire {
  reference: string
  amountSatang: number
  currency: string
  /** Masked — Eventa never stores a bank account number. */
  bankAccount: string
  status: PayoutStatus
  periodCovered: string | null
  requestedAt: string
  completedAt: string | null
  failureReason: string | null
  canRetry: boolean
}

/**
 * The three headline balances.
 *
 * Every figure is null until a payout account is connected — the provider is
 * the one holding the money, and "not connected" is not "฿0".
 */
export interface BalancesWire {
  availableSatang: number | null
  pendingSatang: number | null
  paidOutSatang: number | null
  payoutsConnected: boolean
}

export interface PayoutRow {
  reference: string
  amount: string
  bankAccount: string
  status: PayoutStatus
  statusLabel: string
  statusTone: BadgeTone
  /** Hugeicons slug shown inside the status pill. */
  statusIcon: string
  period: string
  requested: string
  /** `Jul 20, 2026`, or `—` while it has not landed. */
  completed: string
  failureReason: string | null
  canRetry: boolean
}

/* ── invoices ─────────────────────────────────────────────────────────── */

export type InvoiceStatus = 'issued' | 'paid' | 'overdue' | 'void'

export interface InvoiceWire {
  id: number
  number: string
  orderReference: string
  eventId: string
  eventName: string
  buyerName: string
  buyerEmail: string
  issuedAt: string
  dueAt: string
  /** Days to the due date; negative once overdue. */
  daysUntilDue: number
  subtotalSatang: number
  vatAmountSatang: number
  amountSatang: number
  currency: string
  status: InvoiceStatus
  paidVia: string | null
  paidOn: string | null
  canVoid: boolean
  voidBlockedReason: string | null
}

export interface InvoiceCountsWire {
  issued: number
  paid: number
  overdue: number
  void: number
}

export interface InvoiceRow {
  id: number
  number: string
  event: string
  buyer: string
  buyerEmail: string
  amount: string
  vat: string
  issued: string
  due: string
  /** `Due in 6 days`, `Overdue by 3 days`, or `Paid`. */
  dueNote: string
  status: InvoiceStatus
  statusLabel: string
  statusTone: BadgeTone
  /** Hugeicons slug shown inside the status pill. */
  statusIcon: string
  canVoid: boolean
  voidBlockedReason: string | null
}

/* ── VAT ──────────────────────────────────────────────────────────────── */

export type TaxStatus = 'upcoming' | 'due' | 'filed'

export interface TaxPeriodWire {
  year: number
  month: number
  period: string
  /** The 15th of the following month, as a plain date. */
  dueAt: string
  salesSatang: number
  vatSatang: number
  whtSatang: number
  remittedSatang: number
  status: TaxStatus
  filedAt: string | null
  /** Filed after the 15th — recorded, not blocked. */
  late: boolean
  canFile: boolean
}

export interface VatHeadlinesWire {
  vatCollectedSatang: number
  vatRemittedSatang: number
  vatPayableSatang: number
  withholdingSatang: number
}

export interface VatLedgerWire {
  periods: TaxPeriodWire[]
  headlines: VatHeadlinesWire
}

export interface TaxRow {
  key: string
  year: number
  month: number
  period: string
  due: string
  sales: string
  vat: string
  withholding: string
  remitted: string
  status: TaxStatus
  statusLabel: string
  statusTone: BadgeTone
  /** Hugeicons slug shown inside the status pill. */
  statusIcon: string
  /** Set when it was filed after the deadline — recorded, never hidden. */
  lateNote: string | null
  canFile: boolean
}
