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

/** Turned down by the organizer (US-REG-02). */
const REJECTED = 'rejected'
const AWAITING_APPROVAL = 'Awaiting approval'

/*
 * Both point at THIS page, not an inbox: the organizer can switch the
 * confirmation email off (US-MSG-01), and the ticket always appears here.
 */

/** Paid for, and waiting for the organizer's decision (US-REG-02). */
export const AWAITING_APPROVAL_PAID_STATE: OrderState = {
  label: AWAITING_APPROVAL,
  tone: 'amber',
  detail:
    "Your payment was received. The organizer reviews each registration — your tickets will appear on this page once it's approved, and your payment is refunded in full if it isn't.",
}

/** Free, and waiting for the organizer's decision (US-REG-02). */
export const AWAITING_APPROVAL_FREE_STATE: OrderState = {
  label: AWAITING_APPROVAL,
  tone: 'amber',
  detail:
    "The organizer reviews each registration. Your ticket will appear on this page once it's approved.",
}

const NOT_APPROVED = 'The organizer did not approve this registration.'

/** What became of a rejected registration's money — nothing to say if none was taken. */
const REJECTED_MONEY: Readonly<Partial<Record<string, string>>> = {
  refunded: 'Your payment has been refunded.',
  paid: 'Your payment is being refunded.',
}

/** Statuses that owe nothing, whatever the payment fields say. */
const OWES_NOTHING: ReadonlySet<string> = new Set([WAITLISTED, REJECTED])

/** Money reached the organizer — and stays a fact once it has gone back. */
const MONEY_CHANGED_HANDS: ReadonlySet<string> = new Set(['paid', 'refunded'])

/** The receipt's heading, for each of the three things its figures can mean. */
const RECEIPT_HEADING = {
  owed: 'What you owe',
  paid: 'What you paid',
  neither: 'Order total',
} as const

/**
 * The receipt's heading. The same figures are money still due, money that
 * changed hands, or money never taken — a lapsed order, a waitlist entry, a
 * registration turned down before it was charged — and "What you paid" above
 * that last kind is the small lie that makes somebody check their bank.
 *
 * `canPay` comes from the page, because the hold's countdown can end while
 * the page is open.
 */
export function receiptHeading({ canPay, paid }: { canPay: boolean; paid: boolean }): string {
  if (canPay) return RECEIPT_HEADING.owed
  return paid ? RECEIPT_HEADING.paid : RECEIPT_HEADING.neither
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
    paid: MONEY_CHANGED_HANDS.has(wire.paymentStatus),
    onWaitlist: wire.status === WAITLISTED,
    awaitingApproval: wire.awaitingApproval,
    ticketsExplained: ticketsExplained(wire),
    holdExpiresAt: wire.holdExpiresAt,
    payable: isOwed(wire) && wire.status === 'pending' && holdLive,
  }
}

/**
 * Money still outstanding — placed, priced, and nothing has cleared. Not while
 * merely waiting in line: nothing is owed until a seat has been offered. Not
 * while awaiting approval: a paid one has paid, a free one never owed. And not
 * once turned down.
 */
function isOwed(wire: GuestOrderWire): boolean {
  return (
    wire.paymentRequired &&
    wire.paymentStatus !== 'paid' &&
    !wire.awaitingApproval &&
    !OWES_NOTHING.has(wire.status)
  )
}

/** The state banner already says why there is no ticket. */
function ticketsExplained(wire: GuestOrderWire): boolean {
  return isOwed(wire) || wire.awaitingApproval || OWES_NOTHING.has(wire.status)
}

function rejectedState(paymentStatus: string): OrderState {
  const money = REJECTED_MONEY[paymentStatus]
  return {
    label: 'Not approved',
    tone: 'red',
    detail: money ? `${NOT_APPROVED} ${money}` : NOT_APPROVED,
  }
}

function awaitingApprovalState(wire: GuestOrderWire): OrderState {
  return wire.paymentStatus === 'paid'
    ? AWAITING_APPROVAL_PAID_STATE
    : AWAITING_APPROVAL_FREE_STATE
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
  // Before the refund check: "not approved" is why the money came back.
  if (wire.status === REJECTED) return rejectedState(wire.paymentStatus)
  if (wire.paymentStatus === 'refunded') {
    return { label: 'Refunded', tone: 'gray', detail: 'The payment has been returned.' }
  }
  if (wire.status === WAITLISTED) return WAITLIST_STATE
  // Before expiry: waiting for a decision has no hold to lapse.
  if (wire.awaitingApproval) return awaitingApprovalState(wire)
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
