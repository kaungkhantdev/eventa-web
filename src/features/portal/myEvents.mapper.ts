import type { Panel } from '@/app/panels'
import { MASKED, bangkokDate, bangkokTime, baht } from '@/lib/format'
import { qrDataUrl } from '@/lib/qr'
import type {
  MyEventRow,
  MyRegistrationWire,
  PaymentSummaryWire,
  PaymentTotals,
  TicketChoice,
  TicketPass,
  TicketPassWire,
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

/**
 * Every status `GET /me/payments` can put on a row.
 *
 * `payment_status` holds four values, but this endpoint shows only settled
 * money: the repository filters on `SETTLED` and `TransactionDto.status`
 * republishes the narrowed pair as `enum: ['paid', 'refunded']`
 * (`eventa-api/src/modules/attendee-payments`). `TransactionWire.status` is a
 * plain `string`, so nothing on the wire narrows it for us — naming the two
 * here is what makes the map below total.
 */
export type TransactionStatusWire = 'paid' | 'refunded'

/**
 * Did money go back to them?
 *
 * A total map rather than a set of the refund statuses, because the history is
 * a binary on screen — a row is struck through and badged "Refunded", or it is
 * badged "Paid" — so every status has to be placed, and a status nobody placed
 * would quietly read as "Paid". `partially_refunded` sat in the old
 * `Set<string>` for exactly that reason: a set of plain strings accepts a value
 * the API cannot send, while a missing or invented key here is a `tsc` error.
 */
const MONEY_CAME_BACK: Record<TransactionStatusWire, boolean> = {
  paid: false,
  refunded: true,
}

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
    ticketIds: wire.ticketIds,
    // The API writes the phrase ("in 3 days") and stops once it has passed.
    countdown: wire.countdown ?? '',
    attended: wire.attended,
    image: wire.coverImage,
  }
}

const SVG_DATA_URL = 'data:image/svg+xml;charset=utf-8,'

/**
 * One ticket's pass → the modal (US-DISC-07).
 *
 * The QR carries the ticket's own token, because that is the only thing the
 * check-in station looks a ticket up by. It used to carry the event's public
 * URL: the same picture for every buyer, and one the door answers "Invalid
 * ticket". A ticket that no longer admits gets no QR at all.
 *
 * The download is the pass the API printed (`printable`), not one painted
 * here: only the API knows the seat, the class and the admission number, and
 * it refuses to print a ticket that no longer admits.
 */
export function toTicketPass(wire: TicketPassWire, printed: Panel<string>): TicketPass {
  return {
    id: wire.id,
    reference: wire.reference,
    admission: wire.admissionNumber,
    valid: wire.valid,
    qr: wire.valid ? qrDataUrl(wire.qrToken) : null,
    printable: printed.ok ? SVG_DATA_URL + encodeURIComponent(printed.data) : null,
    printRefusal: printed.ok ? null : printed.error,
    filename: `eventa-ticket-${wire.id}.svg`,
  }
}

/**
 * The switcher between an order's tickets, numbered in admission order. One
 * ticket needs no switcher, so it gets no choices.
 */
export function ticketChoices(ticketIds: readonly string[]): TicketChoice[] {
  if (ticketIds.length < 2) return []
  return ticketIds.map((value, index) => ({ value, label: `Ticket ${index + 1}` }))
}

/**
 * The loaded pass, only while it answers the ticket asked for. The router
 * reports a fetcher's next load a render late, so without this the last
 * ticket's QR is shown under the next one's name.
 */
export function passOnShow(
  ticketId: string | null,
  loaded: Panel<TicketPass> | null,
): Panel<TicketPass> | null {
  if (!ticketId || !loaded) return null
  if (loaded.ok && loaded.data.id !== ticketId) return null
  return loaded
}

function placeOf(wire: MyRegistrationWire): string {
  if (wire.isOnline) return 'Online event'
  return [wire.venueName, wire.city].filter(Boolean).join(', ')
}

export function toTransactionRow(wire: TransactionWire): TransactionRow {
  return {
    id: wire.paymentId,
    // The invoice number the row promises (US-DISC-10) — an order nobody
    // invoiced has none, and its reference is what identifies it.
    number: wire.invoiceNumber ?? wire.reference,
    event: wire.eventName,
    method: wire.method,
    status: wire.status,
    // The server already formatted this, including the Free sentinel.
    amount: wire.amountLabel,
    // A payment that never completed has no date; today's would be a lie.
    date: bangkokDate(wire.paidAt),
    // The narrowing happens here, since the wire says only `string`: a status
    // outside the published pair matches no key and is not claimed as a refund.
    refunded: MONEY_CAME_BACK[wire.status as TransactionStatusWire] ?? false,
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
