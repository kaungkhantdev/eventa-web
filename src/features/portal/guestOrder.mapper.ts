import { bangkokDate, satang } from '@/lib/format'
import { QR_FILE_EXTENSION, qrDataUrl } from '@/lib/qr'
import type {
  AccountLinkResult,
  AccountOffer,
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

/** Settled: paid or free, approved, and still standing. */
const CONFIRMED_STATE: OrderState = {
  label: 'Confirmed',
  tone: 'green',
  detail: 'Show the code below at the door.',
}

/** How the offer is turned down — true only because it is made only for a ticketed order. */
const NOT_NOW = 'Not now — your ticket is already in your email'

/** Where this order lives — the link in the confirmation email. */
export function guestOrderPath(orderId: string): string {
  return `/my/tickets/orders/${orderId}`
}

/**
 * The account offer under the order (US-DISC-15), or `null` for none.
 *
 * Made only for an order with a ticket to keep — "I have just confirmed a
 * registration", "alongside my ticket" — because its dismiss line says the
 * ticket is already in their email, which is false for an order still unpaid,
 * waiting or turned down: no ticket exists and no ticket email went out.
 *
 * Opening this page proves nothing about who reads the buyer's inbox — its
 * link is shown to whoever booked, before anybody reads that inbox — so no
 * account is ever made here, and no password is ever asked for here. "Create
 * account" emails the booking's address a one-time link, and the account is
 * made from that. An address that already has an account is invited to sign
 * in instead, with no way to ask for a duplicate.
 *
 * `link` is what the request for the link reported, when one was made.
 */
export function accountOfferFor(
  order: Pick<GuestOrder, 'orderId' | 'buyerEmail' | 'ticketed'>,
  accountExists: boolean,
  link?: AccountLinkResult,
): AccountOffer | null {
  if (!order.ticketed) return null
  if (link?.sentTo) {
    return {
      kind: 'sent',
      message: `We've sent a link to ${link.sentTo}. Open it to choose a password — it proves the address is yours.`,
    }
  }
  return {
    kind: accountExists ? 'sign-in' : 'create',
    prompt: accountExists
      ? `You already have an account for ${order.buyerEmail}. Sign in to see every booking in one place.`
      : `Create an account for ${order.buyerEmail} and every booking is in one place.`,
    signInTo: `/portal/login?from=${encodeURIComponent(guestOrderPath(order.orderId))}`,
    dismiss: NOT_NOW,
    error: link?.error ?? null,
  }
}

export function toGuestOrder(wire: GuestOrderWire, now: Date): GuestOrder {
  const holdLive = isHoldLive(wire, now)
  const state = stateOf(wire, holdLive)
  const tickets = wire.tickets.map((ticket) => toTicket(ticket, wire.buyerName))
  return {
    orderId: wire.orderId,
    reference: wire.reference,
    eventName: wire.eventName,
    buyerName: wire.buyerName,
    buyerEmail: wire.buyerEmail,
    placedOn: bangkokDate(wire.placedAt),
    state,
    lines: wire.lines.map(toLine),
    subtotal: satang(wire.subtotalSatang),
    // Nothing taken off is not a discount of zero: the row is simply absent.
    discount: wire.discountSatang > 0 ? satang(wire.discountSatang) : null,
    vat: satang(wire.vatSatang),
    total: satang(wire.totalSatang),
    tickets,
    awaitingPayment: isOwed(wire),
    paid: MONEY_CHANGED_HANDS.has(wire.paymentStatus),
    onWaitlist: wire.status === WAITLISTED,
    awaitingApproval: wire.awaitingApproval,
    ticketsExplained: ticketsExplained(wire),
    // The state decides first: a stray ticket row on a cancelled or refunded
    // order is not a ticket to keep.
    ticketed: state === CONFIRMED_STATE && tickets.some((ticket) => ticket.valid),
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

/**
 * The ticket statuses that still admit — the API's own rule for a valid pass
 * (`attendee-tickets.service.ts`). A scanned ticket is still the guest's.
 */
const ADMITS: ReadonlySet<string> = new Set(['issued', 'checked_in'])

/**
 * A ticket names nobody until somebody assigns it; the buyer bought it.
 *
 * The QR is drawn from the ticket's own token, the only thing the check-in
 * station looks a ticket up by. One that no longer admits is not drawn: a
 * picture the door refuses is worse than none.
 */
function toTicket(ticket: IssuedTicketWire, buyerName: string): GuestTicket {
  const valid = ADMITS.has(ticket.status)
  return {
    id: ticket.id,
    qrToken: ticket.qrToken,
    holder: ticket.holderName ?? buyerName,
    label: ticket.ticketLabel ?? UNTITLED_TICKET,
    valid,
    qr: valid ? qrDataUrl(ticket.qrToken) : null,
    download: `eventa-ticket-${ticket.id}${QR_FILE_EXTENSION}`,
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
  return CONFIRMED_STATE
}
