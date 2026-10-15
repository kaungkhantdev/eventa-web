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
  /**
   * The order's tickets, in admission order. Each one opens at
   * `GET /me/tickets/{ticketId}`, which is the only place its QR token lives.
   */
  ticketIds: string[]
  /** "in 3 days", or null once it has passed. */
  countdown: string | null
  attended: boolean
}

/** `GET /me/tickets/{ticketId}` — one ticket's pass, verbatim. */
export interface TicketPassWire {
  id: string
  /** The order's reference, which the pass prints as the ticket's. */
  reference: string
  /** What the door scans — the bearer credential the QR encodes. */
  qrToken: string
  status: string
  /** False once refunded, voided or transferred. */
  valid: boolean
  holderName: string | null
  ticketLabel: string | null
  /** "2 of 3" — this ticket's place among the order's admissions. */
  admissionNumber: string
  eventName: string
  eventSlug: string
  startAt: string
  timezone: string
  venueName: string | null
  venueAddress: string | null
  city: string | null
  isOnline: boolean
  seat: { section: string | null; row: string | null; number: string | null } | null
}

export interface MyEventsWire {
  upcoming: MyRegistrationWire[]
  past: MyRegistrationWire[]
  counts: { upcoming: number; past: number }
}

export interface TransactionWire {
  paymentId: string
  /** The order's own reference. */
  reference: string
  /** The tax invoice the organizer issued for the order; null when none was. */
  invoiceNumber: string | null
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
  /** What the Ticket button opens, one pass per id. */
  ticketIds: string[]
  /** "in 3 days" — the API's phrase, empty once the event has passed. */
  countdown: string
  attended: boolean
  image: string | null
}

/** One ticket, as the ticket modal shows it (US-DISC-07). */
export interface TicketPass {
  id: string
  reference: string
  /** "1 of 2". */
  admission: string
  valid: boolean
  /**
   * The QR as an image, encoding the ticket's own token. `null` for a ticket
   * that no longer admits — or a token too long to draw — rather than a
   * picture the door would refuse.
   */
  qr: string | null
  /**
   * The printable pass the API rendered, as a `data:` URL the preview shows
   * and the download link saves. `null` when the API refused to print it.
   */
  printable: string | null
  /** The API's own reason there is no download, in its words. */
  printRefusal: string | null
  /** What the download is saved as. */
  filename: string
}

/** One entry in the modal's switcher between an order's tickets. */
export interface TicketChoice {
  value: string
  label: string
}

export interface TransactionRow {
  id: string
  /** The invoice number when one was issued, else the order reference. */
  number: string
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
