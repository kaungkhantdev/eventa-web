import { bangkokDate, satang } from '@/lib/format'
import type {
  GuestOrder,
  GuestOrderLineWire,
  GuestOrderWire,
  GuestTicket,
  IssuedTicketWire,
  OrderState,
} from './guestOrder.types'

/**
 * An order row → the page a guest sees after registering (US-DISC-06/07).
 *
 * The state is derived here rather than in the markup because it is the whole
 * point of the screen: somebody who has just paid wants one word telling them
 * whether they are in, and a pending order — the commonest case, since a card
 * payment settles after the redirect — needs to say so plainly instead of
 * showing an empty ticket list and no explanation.
 */

const UNTITLED_TICKET = 'Admission'

/**
 * Nobody paid and the clock ran out.
 *
 * Exported because the page needs the same words when the countdown reaches
 * zero while somebody is looking at it — the server still says `pending` for a
 * few seconds after that, and the copy must not depend on which of the two got
 * there first.
 */
export const EXPIRED_STATE: OrderState = {
  label: 'Expired',
  tone: 'gray',
  detail: 'The seats were released because the payment was not completed in time.',
}

/** In line for a sold-out ticket, with no seat offered yet (US-REG-04). */
const WAITLISTED = 'waitlisted'

export const WAITLIST_STATE: OrderState = {
  label: 'On the waitlist',
  tone: 'amber',
  detail:
    "Nothing is charged while you wait. If a place opens up we'll email you, and hold it for a limited time while you pay.",
}

export function toGuestOrder(wire: GuestOrderWire, now: Date): GuestOrder {
  const holdLive = isHoldLive(wire, now)
  return {
    orderId: wire.orderId,
    reference: wire.reference,
    eventName: wire.eventName,
    buyerName: wire.buyerName,
    buyerEmail: wire.buyerEmail,
    placedOn: bangkokDate(wire.placedAt),
    state: stateOf(wire, holdLive),
    lines: wire.lines.map(toLine),
    subtotal: satang(wire.subtotalSatang),
    // Nothing taken off is not a discount of zero: the row is simply absent.
    discount: wire.discountSatang > 0 ? satang(wire.discountSatang) : null,
    vat: satang(wire.vatSatang),
    total: satang(wire.totalSatang),
    tickets: wire.tickets.map((ticket) => toTicket(ticket, wire.buyerName)),
    awaitingPayment: isOwed(wire),
    onWaitlist: wire.status === WAITLISTED,
    holdExpiresAt: wire.holdExpiresAt,
    payable: isOwed(wire) && wire.status === 'pending' && holdLive,
  }
}

/**
 * Money still outstanding — placed, priced, and nothing has cleared. Not while
 * merely waiting in line: nothing is owed until a seat has been offered.
 */
function isOwed(wire: GuestOrderWire): boolean {
  return wire.paymentRequired && wire.paymentStatus !== 'paid' && wire.status !== WAITLISTED
}

/**
 * Are the seats still reserved?
 *
 * `null` is not "forever" — it means no hold was ever taken (an organizer
 * entered this registration by hand) or the last one is already gone. Either
 * way there is nothing holding inventory, so nothing to count down to.
 */
function isHoldLive(wire: GuestOrderWire, now: Date): boolean {
  if (!wire.holdExpiresAt) return false
  return new Date(wire.holdExpiresAt).getTime() > now.getTime()
}

function toLine(line: GuestOrderLineWire) {
  return {
    name: line.ticketTypeName,
    quantity: line.quantity,
    each: satang(line.unitPriceSatang),
    total: satang(line.lineSubtotalSatang),
  }
}

/** A ticket names nobody until somebody assigns it; the buyer bought it. */
function toTicket(ticket: IssuedTicketWire, buyerName: string): GuestTicket {
  return {
    id: ticket.id,
    qrToken: ticket.qrToken,
    holder: ticket.holderName ?? buyerName,
    label: ticket.ticketLabel ?? UNTITLED_TICKET,
  }
}

/**
 * Where the order stands, decided in one place.
 *
 * Order first, money second: a cancelled order is cancelled whatever was paid,
 * and a refund is a fact about the money that outlives the booking.
 */
function stateOf(wire: GuestOrderWire, holdLive: boolean): OrderState {
  if (wire.status === 'cancelled') {
    return { label: 'Cancelled', tone: 'red', detail: 'This registration was cancelled.' }
  }
  if (wire.paymentStatus === 'refunded') {
    return { label: 'Refunded', tone: 'gray', detail: 'The payment has been returned.' }
  }
  if (wire.status === WAITLISTED) return WAITLIST_STATE
  // Expired covers two moments that look identical to the buyer: the API has
  // swept the order, or the hold has lapsed and the sweep is seconds behind.
  // Both mean the seats went back on sale, so both have to say so — waiting for
  // the server to agree would leave the page promising tickets that are gone.
  if (isOwed(wire) && (wire.status === 'expired' || !holdLive)) return EXPIRED_STATE
  if (isOwed(wire)) {
    return {
      label: 'Awaiting payment',
      tone: 'amber',
      detail: 'Your seats are held until the countdown ends.',
    }
  }
  return { label: 'Confirmed', tone: 'green', detail: 'Show the code below at the door.' }
}
