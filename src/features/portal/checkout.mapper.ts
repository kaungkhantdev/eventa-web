import { MASKED, bangkokDateRange } from '@/lib/format'
import type { Persona } from '@/lib/persona'
import type { ProfileWire } from './profile.types'
import type {
  BookingMode,
  BuyerDefaults,
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
  WaitlistJoinedWire,
  WaitlistPlace,
} from './checkout.types'

/**
 * The public checkout → what the register page renders (US-DISC-04/05/06).
 *
 * No money is computed here. The subtotal, the discount, the service fee and
 * the VAT are all the API's own figures, and its labels are shown verbatim:
 * a total worked out in the browser could disagree with the one charged, and
 * the charged one is the one that counts.
 */

/**
 * Every value the `ticket_status` pgEnum (`eventa-api/src/db/schema/enums.ts`)
 * can store, which is every value a tier can arrive with.
 *
 * `CheckoutTierDto.status` republishes that enum through
 * `@ApiProperty({ enum: ticketStatusEnum.enumValues })` but is typed as a
 * plain `string`, so nothing on the wire narrows it for us. Naming the four
 * here is what makes `UNAVAILABLE` below a total map of the three a buyer can
 * be refused for, rather than a list anybody can add invented values to.
 */
export type TicketStatusWire = 'onsale' | 'scheduled' | 'paused' | 'soldout'

/**
 * Why a tier cannot be chosen, in words the buyer can act on.
 *
 * `onsale` is absent because the API decides selectability with
 * `status === 'onsale'` exactly (`checkout-view.service.ts`): an on-sale tier
 * is answered before this table is consulted, and the other three are the only
 * refusals the API can report.
 */
const UNAVAILABLE: Record<Exclude<TicketStatusWire, 'onsale'>, string> = {
  soldout: 'Sold out',
  paused: 'Paused',
  scheduled: 'Not on sale yet',
}

const UNAVAILABLE_FALLBACK = 'Unavailable'
const WAITLIST_OPEN = 'Sold out · join the waitlist'

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
    notes: [wire.notes.seating, wire.notes.delivery, wire.notes.approval].filter(
      (note): note is string => Boolean(note),
    ),
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
  // What is left does not limit a waitlist request: nothing is, by definition.
  if (tier.remaining !== null && !tier.waitlist) limits.push(tier.remaining)
  return {
    id: tier.id,
    name: tier.name,
    price: tier.priceLabel,
    isFree: tier.isFree,
    selectable: tier.canSelect,
    waitlist: tier.waitlist,
    unavailableReason: unavailableReasonOf(tier),
    minPerOrder: tier.minPerOrder,
    maxPerOrder: Math.min(...limits),
  }
}

function unavailableReasonOf(tier: CheckoutTierWire): string | null {
  if (tier.canSelect) return null
  if (tier.waitlist) return WAITLIST_OPEN
  // `status` is a plain string on the wire, so the narrowing happens here: a
  // value outside the enum misses every key and is refused in general terms
  // rather than with copy somebody guessed at.
  return UNAVAILABLE[tier.status as Exclude<TicketStatusWire, 'onsale'>] ?? UNAVAILABLE_FALLBACK
}

/** 1 → "next"; the rest ordinally, as a person would say it. */
export function placeInLine(position: number): string {
  if (position <= 1) return "You're next in line"
  return `You're ${position}${ordinalSuffix(position)} in line`
}

function ordinalSuffix(n: number): string {
  const teen = n % 100
  if (teen >= 11 && teen <= 13) return 'th'
  return ORDINAL[n % 10] ?? 'th'
}

const ORDINAL: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }

export function toWaitlistPlace(joined: WaitlistJoinedWire): WaitlistPlace {
  return {
    orderId: joined.orderId,
    reference: joined.reference,
    eventName: joined.eventName,
    ticketsLabel: `${joined.quantity} × ${joined.ticketTypeName}`,
    place: placeInLine(joined.position),
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
    orderId: order.orderId,
    reference: order.reference,
    eventName: order.eventName,
    buyerEmail: order.buyerEmail,
    ticketCount: order.summary.quantity,
    total: order.summary.labels.total,
    paymentRequired: order.paymentRequired,
    awaitingApproval: order.awaitingApproval,
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
    checkoutUrl: intent.checkoutUrl,
    declineReason: intent.declineReason,
  }
}

function stateOf(intent: PaymentIntentWire): PaymentStep['state'] {
  if (intent.status === FAILED) return FAILED
  return intent.method === PROMPT_PAY ? 'scan' : 'provider'
}

/* ── who is booking (US-DISC-11, criterion 5) ───────────────────────────── */

/**
 * The one persona whose saved profile fills the buyer boxes.
 *
 * Named once and read by both rules below, because "whose details pre-fill"
 * and "whose profile is worth fetching" have to be the same answer: a loader
 * that fetched for somebody the mapper then ignores would spend a round trip
 * to achieve nothing, and one that fetched for fewer would leave a signed-in
 * attendee retyping details the product already holds.
 */
const PREFILLING_PERSONA: Persona = 'attendee'

/**
 * Whether this visitor's saved profile should be read at all.
 *
 * The decisive rule of this criterion, because the checkout loader is PUBLIC —
 * registering never requires an account (US-ACC-03), and eventa-api's checkout
 * controller is `@Public` throughout. `/me/profile` needs a token, so fetching
 * it unconditionally would reject with a 401 for every guest, and a loader that
 * rejects replaces the registration page with an error element. The guest path
 * must not change at all, so for a guest there is no request to fail.
 *
 * An organizer session is refused too. The two personas never share a login
 * (`@/lib/persona`), and an admin token establishes who runs a workspace, not
 * who is buying this ticket — the portal's own test for "signed in" is this
 * same one, as `discover.routes.ts` uses for the shortlist.
 */
export function prefillsFromProfile(persona: Persona | null): boolean {
  return persona === PREFILLING_PERSONA
}

/**
 * The saved profile → what the buyer boxes start with.
 *
 * `profile` is `null` for two different reasons and the answer is the same
 * empty form for both: nobody is signed in, or the profile of somebody who is
 * could not be read. The second is deliberate — see `savedProfile` in
 * `checkout.routes.ts`. Checkout is the money path, and three fields of typing
 * is a far better outcome than an error page where a sale was.
 *
 * The persona is re-checked here even though the loader only fetches for an
 * attendee: it makes the rule total, and the failure it forecloses is a
 * profile left over from one visitor pre-filling another visitor's PII.
 *
 * Mapped from the wire rather than through `toAttendeeProfileCard`, because
 * that is the Profile tab's view model — initials, a badge tone, a bio — and
 * routing one page's data through another page's shape couples two screens
 * that have no reason to move together.
 */
export function toBuyerDefaults(
  persona: Persona | null,
  profile: ProfileWire | null,
): BuyerDefaults {
  if (!prefillsFromProfile(persona) || !profile) return NO_BUYER_DEFAULTS
  return {
    name: profile.name,
    // The address that signs in, never `pendingEmail`. An address change is
    // not done until it is confirmed (criterion 2), so a pending one is an
    // inbox nobody has proved they can open — and this is where the ticket
    // and the receipt are sent.
    email: profile.email,
    // `null` is not the string "null", and it is not "0" either: a phone the
    // API holds nothing for is a box nobody filled.
    phone: profile.phone ?? '',
  }
}

/** A guest's boxes, and the fallback when a profile could not be read. */
const NO_BUYER_DEFAULTS: BuyerDefaults = { name: '', email: '', phone: '' }
