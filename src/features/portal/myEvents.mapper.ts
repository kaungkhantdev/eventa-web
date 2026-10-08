import { MASKED, bangkokDate, bangkokTime, baht } from '@/lib/format'
import type {
  MyEventRow,
  MyRegistrationWire,
  PaymentSummaryWire,
  PaymentTotals,
  TransactionRow,
  TransactionWire,
} from './myEvents.types'

/**
 * The attendee's own tickets and payments → what the portal renders.
 *
 * The one rule that differs from the console: an event is dated in ITS OWN
 * timezone, not Bangkok and not the reader's. Someone checking a ticket from
 * abroad needs to know when the event starts where it happens.
 */

/** A payment whose status means money went back to them. */
const REFUNDED = new Set(['refunded', 'partially_refunded'])

export function toMyEventRow(wire: MyRegistrationWire): MyEventRow {
  return {
    orderId: wire.orderId,
    reference: wire.reference,
    title: wire.eventName,
    slug: wire.eventSlug,
    when: `${bangkokDate(wire.startAt, wire.timezone)} · ${bangkokTime(wire.startAt, wire.timezone)}`,
    where: placeOf(wire),
    venue: wire.isOnline
      ? null
      : { venueName: wire.venueName, address: wire.venueAddress, city: wire.city },
    // The booking is real even when the tier has since been deleted, so the
    // column says "—" rather than disappearing.
    ticket: wire.ticketTypeName ?? MASKED,
    ticketCount: wire.ticketCount,
    // The API writes the phrase ("in 3 days") and stops once it has passed.
    countdown: wire.countdown ?? '',
    attended: wire.attended,
    image: wire.coverImage,
  }
}

function placeOf(wire: MyRegistrationWire): string {
  if (wire.isOnline) return 'Online event'
  return [wire.venueName, wire.city].filter(Boolean).join(', ')
}

export function toTransactionRow(wire: TransactionWire): TransactionRow {
  return {
    id: wire.paymentId,
    reference: wire.reference,
    event: wire.eventName,
    method: wire.method,
    status: wire.status,
    // The server already formatted this, including the Free sentinel.
    amount: wire.amountLabel,
    // A payment that never completed has no date; today's would be a lie.
    date: bangkokDate(wire.paidAt),
    refunded: REFUNDED.has(wire.status),
  }
}

/**
 * The three figures above the history.
 *
 * Deliberately NOT the API's labels: it formats zero as "Free", which is a
 * price and reads as nonsense against a total. "Spent: Free" and "Refunded:
 * Free" are not facts about money — `฿0` is.
 */
export function toPaymentTotals(wire: PaymentSummaryWire): PaymentTotals {
  return {
    spent: total(wire.totalSpentSatang, wire.totalSpentLabel),
    refunded: total(wire.totalRefundedSatang, wire.totalRefundedLabel),
    count: wire.transactionCount,
  }
}

function total(satang: number, label: string): string {
  return satang === 0 ? baht(0) : label
}
