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

export function toGuestOrder(wire: GuestOrderWire): GuestOrder {
  return {
    orderId: wire.orderId,
    reference: wire.reference,
    eventName: wire.eventName,
    buyerName: wire.buyerName,
    buyerEmail: wire.buyerEmail,
    placedOn: bangkokDate(wire.placedAt),
    state: stateOf(wire),
    lines: wire.lines.map(toLine),
    subtotal: satang(wire.subtotalSatang),
    // Nothing taken off is not a discount of zero: the row is simply absent.
    discount: wire.discountSatang > 0 ? satang(wire.discountSatang) : null,
    vat: satang(wire.vatSatang),
    total: satang(wire.totalSatang),
    tickets: wire.tickets.map((ticket) => toTicket(ticket, wire.buyerName)),
    awaitingPayment: wire.paymentRequired && wire.paymentStatus !== 'paid',
  }
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
function stateOf(wire: GuestOrderWire): OrderState {
  if (wire.status === 'cancelled') {
    return { label: 'Cancelled', tone: 'red', detail: 'This registration was cancelled.' }
  }
  if (wire.paymentStatus === 'refunded') {
    return { label: 'Refunded', tone: 'gray', detail: 'The payment has been returned.' }
  }
  if (wire.paymentRequired && wire.paymentStatus !== 'paid') {
    return {
      label: 'Awaiting payment',
      tone: 'amber',
      detail: 'Your tickets are issued the moment the payment clears.',
    }
  }
  return { label: 'Confirmed', tone: 'green', detail: 'Show the code below at the door.' }
}
