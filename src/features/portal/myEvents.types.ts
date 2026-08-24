import type { VenueParts } from '@/lib/mapLink'

/**
 * The attendee's own tickets and payments — `GET /me/tickets` and
 * `GET /me/payments`, as eventa-api describes them.
 *
 * Wire shapes; nothing outside the mapper reads them.
 */

export interface MyRegistrationWire {
  orderId: string
  reference: string
  eventId: string
  eventSlug: string
  eventName: string
  /** UTC instant. */
  startAt: string
  /** The event's own zone — a ticket is for a place, not for the reader. */
  timezone: string
  venueName: string | null
  /** Street address — a venue name alone rarely places a pin. */
  venueAddress?: string | null
  city: string | null
  isOnline: boolean
  coverImage: string | null
  ticketTypeName: string | null
  ticketCount: number
  /** "in 3 days", or null once it has passed. */
  countdown: string | null
  attended: boolean
}

export interface MyEventsWire {
  upcoming: MyRegistrationWire[]
  past: MyRegistrationWire[]
  counts: { upcoming: number; past: number }
}

export interface TransactionWire {
  paymentId: string
  reference: string
  eventName: string
  method: string
  status: string
  /** Integer satang. */
  amountSatang: number
  /** The API's own formatting. */
  amountLabel: string
  paidAt: string | null
}

export interface PaymentSummaryWire {
  totalSpentSatang: number
  totalSpentLabel: string
  totalRefundedSatang: number
  totalRefundedLabel: string
  transactionCount: number
}

/* ------------------------------ view models ------------------------------ */

/** One registered event, ready to render. */
export interface MyEventRow {
  orderId: string
  reference: string
  title: string
  slug: string
  /** `Sat, Jul 18, 2026 · 09:00`, in the event's own timezone. */
  when: string
  where: string
  /**
   * The venue's parts for the map. Null for an online event — there is nowhere
   * to point at, and the API sends null for all three in that case anyway.
   */
  venue: VenueParts | null
  /** The tier bought, or `—` when the tier has since been deleted. */
  ticket: string
  ticketCount: number
  /** "in 3 days" — the API's phrase, empty once the event has passed. */
  countdown: string
  attended: boolean
  image: string | null
}

export interface TransactionRow {
  id: string
  reference: string
  event: string
  method: string
  status: string
  /** `฿1,070`, `Free`, or `—` when withheld. Never `฿0`. */
  amount: string
  date: string
  /** True for a refund, which the table shows as money coming back. */
  refunded: boolean
}

export interface PaymentTotals {
  spent: string
  refunded: string
  count: number
}
