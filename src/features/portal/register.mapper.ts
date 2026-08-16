import { MASKED, bangkokDateRange } from '@/lib/format'
import type {
  BookingMode,
  CheckoutEventWire,
  CheckoutHeader,
  CheckoutTierWire,
  CheckoutView,
  CheckoutViewWire,
  OrderPlacedWire,
  OrderSummaryWire,
  PaymentIntentWire,
  PaymentStep,
  PlacedOrder,
  SeatRow,
  SummaryLines,
  TierOption,
} from './register.types'

/**
 * The public checkout → what the register page renders (US-DISC-04/05/06).
 *
 * No money is computed here. The subtotal, the discount, the service fee and
 * the VAT are all the API's own figures, and its labels are shown verbatim:
 * a total worked out in the browser could disagree with the one charged, and
 * the charged one is the one that counts.
 */

/** Why a tier cannot be chosen, in words the buyer can act on. */
const UNAVAILABLE: Record<string, string> = {
  soldout: 'Sold out',
  paused: 'Paused',
  scheduled: 'Not on sale yet',
  ended: 'Sales have closed',
  retired: 'No longer offered',
}

const UNAVAILABLE_FALLBACK = 'Unavailable'

/**
 * Where "Back to event" goes.
 *
 * The checkout payload carries no event type, so the type-specific template
 * Discover picks cannot be worked out here — aurora is the general-purpose one
 * and every template reads the same event.
 */
const BACK_TEMPLATE = 'aurora'

export function toCheckoutView(wire: CheckoutViewWire): CheckoutView {
  return {
    eventId: wire.event.id,
    header: toHeader(wire.event),
    mode: modeOf(wire.event),
    tiers: wire.tiers.map((tier) => toTierOption(tier, wire.maxPerBooking)),
    rows: toSeatRows(wire),
    notes: [wire.notes.seating, wire.notes.delivery].filter((note): note is string => Boolean(note)),
    maxPerBooking: wire.maxPerBooking,
    paymentRequired: wire.paymentRequired,
  }
}

function toHeader(event: CheckoutEventWire): CheckoutHeader {
  const place = [event.venueName, event.city].filter(Boolean).join(', ')
  return {
    name: event.name,
    when: bangkokDateRange(event.startAt, event.endAt, event.timezone),
    where: place || (event.isOnline ? 'Online' : MASKED),
    organizer: event.organizerName,
    backTo: `/landing/${BACK_TEMPLATE}?event=${encodeURIComponent(event.slug)}`,
  }
}

/** Online wins: an event nobody attends in person has no room to sit in. */
function modeOf(event: CheckoutEventWire): BookingMode {
  if (event.isOnline) return 'online'
  return event.seatingMode === 'reserved' ? 'reserved' : 'general'
}

/**
 * How many of a tier this order may take.
 *
 * The smallest of three separate limits: what the tier allows per order, what
 * the event allows per booking, and what is actually left. `remaining: null`
 * is an unlimited allocation and takes no part — reading it as zero would
 * refuse to sell a tier with infinite stock.
 */
function toTierOption(tier: CheckoutTierWire, maxPerBooking: number): TierOption {
  const limits = [tier.maxPerOrder, maxPerBooking]
  if (tier.remaining !== null) limits.push(tier.remaining)
  return {
    id: tier.id,
    name: tier.name,
    price: tier.priceLabel,
    isFree: tier.isFree,
    selectable: tier.canSelect,
    unavailableReason: tier.canSelect ? null : (UNAVAILABLE[tier.status] ?? UNAVAILABLE_FALLBACK),
    minPerOrder: tier.minPerOrder,
    maxPerOrder: Math.min(...limits),
  }
}

/** Seats, grouped into the rows they are printed in. */
function toSeatRows(wire: CheckoutViewWire): SeatRow[] {
  if (modeOf(wire.event) !== 'reserved' || wire.seatMap === null) return []
  const byRow = new Map<string, SeatRow>()
  for (const seat of wire.seatMap.seats) {
    const label = seat.rowLabel ?? ''
    const row = byRow.get(label) ?? { label, seats: [] }
    row.seats.push({ id: seat.id, label: seat.seatNumber, available: seat.available })
    byRow.set(label, row)
  }
  const rows = [...byRow.values()]
  for (const row of rows) row.seats.sort((a, b) => bySeatNumber(a.label, b.label))
  return rows.sort((a, b) => a.label.localeCompare(b.label))
}

/** `2` before `10`: seat numbers are numbers, and a string sort reverses them. */
function bySeatNumber(a: string, b: string): number {
  const left = Number(a)
  const right = Number(b)
  if (Number.isNaN(left) || Number.isNaN(right)) return a.localeCompare(b)
  return left - right
}

export function toSummaryLines(summary: OrderSummaryWire): SummaryLines {
  return {
    ticketsLabel: `${summary.quantity} × ${summary.ticketTypeName}`,
    subtotal: summary.labels.subtotal,
    discount: summary.labels.discount,
    serviceFee: summary.labels.serviceFee,
    total: summary.labels.total,
    paymentRequired: summary.paymentRequired,
  }
}

/**
 * The order as placed.
 *
 * The count comes from the order, not from `tickets`: a paid order is placed
 * pending and its tickets are minted only once the money arrives, so that array
 * is empty at this point and counting it would tell the buyer they had bought
 * nothing.
 */
export function toPlacedOrder(order: OrderPlacedWire): PlacedOrder {
  return {
    reference: order.reference,
    eventName: order.eventName,
    buyerEmail: order.buyerEmail,
    ticketCount: order.summary.quantity,
    total: order.summary.labels.total,
    paymentRequired: order.paymentRequired,
  }
}

const PROMPT_PAY = 'PromptPay'
const FAILED = 'failed'

/**
 * What the buyer still has to do.
 *
 * Starting a payment is not completing one, and this page never claims it was:
 * PromptPay ends in a QR somebody has to scan, and Card ends at the provider's
 * own hosted fields, which this app does not render (PCI SAQ-A). Either way the
 * money arrives out of band and the API is what learns of it.
 */
export function toPaymentStep(intent: PaymentIntentWire): PaymentStep {
  return {
    state: stateOf(intent),
    amount: intent.amountLabel,
    promptPayQr: intent.promptPayQr,
    declineReason: intent.declineReason,
  }
}

function stateOf(intent: PaymentIntentWire): PaymentStep['state'] {
  if (intent.status === FAILED) return FAILED
  return intent.method === PROMPT_PAY ? 'scan' : 'provider'
}
