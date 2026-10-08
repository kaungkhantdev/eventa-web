import type { BadgeTone } from '@/components/ui'

/** The payments ledger (US-FIN-01/02): every charge, refund and failure. */

export type LedgerStatus = 'paid' | 'pending' | 'refunded' | 'failed'

export type PaymentMethod = 'Card' | 'PromptPay' | 'Bank transfer' | 'Apple Pay' | 'Google Pay'

export interface LedgerEntryWire {
  id: string
  txn: string
  payerName: string
  eventName: string
  method: PaymentMethod
  /** VAT-inclusive, integer satang. */
  amountSatang: number
  currency: string
  status: LedgerStatus
  paidAt: string
  /** False until a charge actually completed. */
  canViewInvoice: boolean
  canRefund: boolean
  /** Why refunding is unavailable; null when it is available. */
  refundBlockedReason: string | null
}

export interface LedgerCountsWire {
  paid: number
  pending: number
  refunded: number
  failed: number
}

export interface PaymentRow {
  id: string
  txn: string
  payer: string
  initials: string
  event: string
  method: PaymentMethod
  methodIcon: string
  /** `฿1,250` — formatted once, here. */
  amount: string
  status: LedgerStatus
  statusLabel: string
  statusTone: BadgeTone
  /** Hugeicons slug shown inside the status pill. */
  statusIcon: string
  /** `Jul 18, 2026`, Bangkok. */
  date: string
  /** `10:24`, Bangkok. */
  time: string
  canRefund: boolean
  canViewInvoice: boolean
  /** The API's own sentence, shown on the disabled control. */
  refundBlockedReason: string | null
}
