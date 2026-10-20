import { MASKED, bangkokDateRange } from '@/lib/format'
import type { Persona } from '@/lib/persona'
import type { ProfileWire } from './profile.types'
import { PAY_METHODS } from './checkout.types'
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
  PayMethod,
  PlacedOrder,
  SeatOption,
  SeatRow,
  SeatState,
  SummaryLines,
  TierOption,
  WaitlistJoinedWire,
  WaitlistPlace,
} from './checkout.types'
import { BACK_TEMPLATE, FAILED, ORDINAL, PREFILLING_PERSONA, PROMPT_PAY, UNAVAILABLE_FALLBACK, WAITLIST_OPEN } from '@/lib/constants/portal.constants'

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
    paymentMethods: offeredMethods(wire.paymentMethods),
  }
}

/**
 * The ways to pay this page offers: those the workspace switched on
 * (US-SET-09), and only ones it knows how to take, in its own order.
 */
function offeredMethods(switchedOn: readonly string[]): PayMethod[] {
  return PAY_METHODS.filter((method) => switchedOn.includes(method))
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
    row.seats.push({
      id: seat.id,
      label: seat.seatNumber,
      available: seat.available,
      ticketTypeId: seat.ticketTypeId,
    })
    byRow.set(label, row)
  }
  const rows = [...byRow.values()]
  for (const row of rows) row.seats.sort((a, b) => numerically(a.label, b.label))
  return rows.sort((a, b) => numerically(a.label, b.label))
}

/**
 * `2` before `10`. The API numbers both rows and seats, and a string sort puts
 * row 10 between rows 1 and 2.
 */
function numerically(a: string, b: string): number {
  const left = Number(a)
  const right = Number(b)
  if (Number.isNaN(left) || Number.isNaN(right)) return a.localeCompare(b)
  return left - right
}

/* ── seats of the chosen ticket type (US-DISC-04) ─────────────────────── */

/** Whether any seat of the map has a ticket type (US-EVT-05). */
export function mapHasTypes(rows: readonly SeatRow[]): boolean {
  return rows.some((row) => row.seats.some((seat) => seat.ticketTypeId !== null))
}

/**
 * Whether a seat can be bought under this ticket type: a seat of that type —
 * each seat carries its own, so a row can be split between types — or, only
 * on a map laid out before seats had types, a seat with no type, which the API
 * sells under any type. Once any seat has a type the API refuses an untyped
 * seat. Mirrors `CheckoutPolicy.resolveSeats`, so the map never offers
 * a seat the API would refuse.
 */
function sellsUnder(seat: SeatOption, tierId: string, typedMap: boolean): boolean {
  if (seat.ticketTypeId === null) return !typedMap
  return seat.ticketTypeId === tierId
}

/**
 * How a seat looks to a buyer who has chosen `tierId` and picked `selected`.
 * `typedMap` is `mapHasTypes` of the whole map, worked out once per render.
 */
export function seatStateOf(
  seat: SeatOption,
  tierId: string,
  selected: readonly number[],
  typedMap: boolean,
): SeatState {
  if (!sellsUnder(seat, tierId, typedMap)) return 'other'
  if (!seat.available) return 'booked'
  return selected.includes(seat.id) ? 'selected' : 'available'
}

/** A seat can be tapped to pick it or to let it go — nothing else can. */
export function canPick(state: SeatState): boolean {
  return state === 'available' || state === 'selected'
}

/**
 * The picked seats that survive a change of ticket type.
 *
 * Another type's seat would only come back from the API as a refusal; dropping
 * it here keeps the buyer's other picks and asks them to choose again only for
 * the seats that no longer fit.
 */
export function seatsKeptForTier(
  selected: readonly number[],
  rows: readonly SeatRow[],
  tierId: string,
): number[] {
  const seats = new Map(rows.flatMap((row) => row.seats).map((seat) => [seat.id, seat]))
  const typedMap = mapHasTypes(rows)
  return selected.filter((id) => {
    const seat = seats.get(id)
    return seat !== undefined && sellsUnder(seat, tierId, typedMap)
  })
}

const EVERYDAY_STATES: readonly SeatState[] = ['selected', 'available', 'booked']

/**
 * What the legend explains. Another type's seats are listed only when the map
 * shows some — on a map with one type, or none, the entry would explain nothing.
 */
export function seatLegendOf(rows: readonly SeatRow[], tierId: string): SeatState[] {
  const typedMap = mapHasTypes(rows)
  const showsOther = rows.some((row) => row.seats.some((seat) => !sellsUnder(seat, tierId, typedMap)))
  return showsOther ? [...EVERYDAY_STATES, 'other'] : [...EVERYDAY_STATES]
}

/**
 * The order summary to show: the last quote, but only while something is
 * picked. With nothing picked — every seat let go, or dropped by a change of
 * ticket type — no quote is asked for, and the last one would still price
 * seats the buyer no longer has (US-DISC-04).
 */
export function summaryShown(summary: SummaryLines | null, count: number): SummaryLines | null {
  return count >= 1 ? summary : null
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
