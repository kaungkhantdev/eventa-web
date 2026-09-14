import type { BadgeTone } from '@/components/ui'
import { bangkokDate, bangkokTime, initials, satang } from '@/lib/format'
import type { LedgerEntryWire, LedgerStatus, PaymentMethod, PaymentRow } from './payments.types'

/** The rules behind the payments ledger (US-FIN-01/02). */

const STATUS_META: Record<LedgerStatus, { label: string; tone: BadgeTone; icon: string }> = {
  paid: { label: 'Paid', tone: 'green', icon: 'hgi-checkmark-badge-01' },
  pending: { label: 'Pending', tone: 'amber', icon: 'hgi-clock-01' },
  refunded: { label: 'Refunded', tone: 'gray', icon: 'hgi-cancel-circle' },
  failed: { label: 'Failed', tone: 'red', icon: 'hgi-alert-circle' },
}

/** How each way of paying is drawn. Unknown methods still get a card glyph. */
const METHOD_ICON: Record<PaymentMethod, string> = {
  Card: 'hgi-credit-card',
  PromptPay: 'hgi-qr-code-01',
  'Bank transfer': 'hgi-bank',
  'Apple Pay': 'hgi-apple',
  'Google Pay': 'hgi-google',
}

export function toPaymentRow(wire: LedgerEntryWire): PaymentRow {
  const meta = STATUS_META[wire.status]
  return {
    id: wire.id,
    txn: wire.txn,
    payer: wire.payerName,
    initials: initials(wire.payerName),
    event: wire.eventName,
    method: wire.method,
    methodIcon: METHOD_ICON[wire.method] ?? METHOD_ICON.Card,
    // Formatted from the integer satang rather than from the API's own label,
    // so every amount in this app goes through one formatter and one rule.
    amount: satang(wire.amountSatang),
    status: wire.status,
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusIcon: meta.icon,
    date: bangkokDate(wire.paidAt),
    time: bangkokTime(wire.paidAt),
    // Refundability is the server's call — it knows the provider's window and
    // what has already gone back. The reason travels with it so a disabled
    // control can say why instead of just being dead.
    canRefund: wire.canRefund,
    canViewInvoice: wire.canViewInvoice,
    refundBlockedReason: wire.refundBlockedReason,
  }
}
