/**
 * Registering for an event (US-DISC-04/05/06), as the public checkout sends it
 * and as the page renders it.
 *
 * Every amount below is either integer satang or a label the API wrote. This
 * app never does arithmetic on money: the service fee, the discount and the VAT
 * are the server's answer, and a total computed here could disagree with the
 * one actually charged.
 */

/* ── what the wire sends ──────────────────────────────────────────────── */

export interface CheckoutEventWire {
  id: string
  slug: string
  name: string
  startAt: string
  endAt: string | null
  timezone: string
  isOnline: boolean
  venueName: string | null
  venueAddress: string | null
  city: string | null
  coverImage: string | null
  organizerName: string
  seatingMode: string
}

export interface CheckoutTierWire {
  id: string
  name: string
  priceLabel: string
  priceSatang: number
  isFree: boolean
  status: string
  canSelect: boolean
  minPerOrder: number
  maxPerOrder: number
  /** `null` means unlimited — emphatically not "none left". */
  remaining: number | null
  /** Sold out, and a buyer may join its waitlist instead (US-REG-04). */
  waitlist: boolean
}

export interface CheckoutSeatWire {
  id: number
  section: string | null
  rowLabel: string | null
  seatNumber: string
  ticketTypeId: string | null
  available: boolean
}

export interface CheckoutViewWire {
  event: CheckoutEventWire
  tiers: CheckoutTierWire[]
  seatMap: { seats: CheckoutSeatWire[] } | null
  /** `approval`: the event requires approval — said before anybody pays (US-REG-02). */
  notes: { seating: string | null; delivery: string | null; approval: string | null }
  maxPerBooking: number
  paymentRequired: boolean
}

export interface OrderSummaryWire {
  eventId: string
  ticketTypeId: string
  ticketTypeName: string
  quantity: number
  seatIds: number[] | null
  unitPriceSatang: number
  subtotalSatang: number
  discountSatang: number
  serviceFeeSatang: number
  totalSatang: number
  netSatang: number
  vatSatang: number
  discountCode: string | null
  labels: {
    subtotal: string
    discount: string | null
    serviceFee: string
    total: string
  }
  paymentRequired: boolean
}

/** `POST /public/checkout/waitlist` — where the buyer now stands. */
export interface WaitlistJoinedWire {
  orderId: string
  reference: string
  eventName: string
  ticketTypeName: string
  quantity: number
  /** 1 is next in line. */
  position: number
}

export interface CheckoutHoldWire {
  holdIds: number[]
  expiresAt: string
}

export interface IssuedTicketWire {
  id: string
  qrToken: string
  holderName: string | null
  ticketLabel: string | null
  status: string
}

export interface OrderPlacedWire {
  orderId: string
  reference: string
  status: string
  paymentStatus: string
  eventName: string
  buyerEmail: string
  totalSatang: number
  vatSatang: number
  summary: OrderSummaryWire
  tickets: IssuedTicketWire[]
  paymentRequired: boolean
  /**
   * The registration now waits for the organizer to approve it (US-REG-02). A
   * paid one starts waiting only once its payment lands, so reads false here.
   */
  awaitingApproval: boolean
}

/* ── what the page renders ────────────────────────────────────────────── */

/** How this event is booked, which decides step 2 entirely. */
export type BookingMode = 'online' | 'reserved' | 'general'

export interface TierOption {
  id: string
  name: string
  price: string
  isFree: boolean
  /** False when this tier cannot be bought — paused, sold out, not yet open. */
  selectable: boolean
  /** Sold out with its waitlist open: chosen to JOIN the line, not to buy. */
  waitlist: boolean
  /** Why not, in words, or `null` when it can be selected. */
  unavailableReason: string | null
  minPerOrder: number
  /** The most this order may take of this tier, once stock is considered. */
  maxPerOrder: number
}

export interface SeatOption {
  id: number
  /** What is printed on the seat, e.g. `12`. */
  label: string
  available: boolean
}

export interface SeatRow {
  label: string
  seats: SeatOption[]
}

/** The event's own heading on the register page. */
export interface CheckoutHeader {
  name: string
  when: string
  where: string
  organizer: string
  /** Where "Back to event" goes. */
  backTo: string
}

export interface CheckoutView {
  eventId: string
  header: CheckoutHeader
  mode: BookingMode
  tiers: TierOption[]
  rows: SeatRow[]
  notes: string[]
  maxPerBooking: number
  paymentRequired: boolean
}

/**
 * What the buyer boxes start out holding (US-DISC-11, criterion 5).
 *
 * Defaults, not a mirror of the profile: somebody buying a ticket for a
 * colleague types over them, and what they type is what is submitted. Every
 * field is a string because each one binds to an input — `null` in a value
 * renders the word "null" — and all three are empty for a guest, who has no
 * saved profile and must see the page exactly as it is today.
 */
export interface BuyerDefaults {
  name: string
  email: string
  /** `''` when the profile holds no phone: not given, not "null". */
  phone: string
}

/** The order summary panel — every line a label the API wrote. */
export interface SummaryLines {
  /** e.g. `2 × General admission`. */
  ticketsLabel: string
  subtotal: string
  /** `null` when no code was applied, so the row is not rendered at all. */
  discount: string | null
  serviceFee: string
  total: string
  paymentRequired: boolean
}

/** What the page says once the buyer has joined the waitlist. */
export interface WaitlistPlace {
  /** Their own page for this registration — the offer will link there too. */
  orderId: string
  reference: string
  eventName: string
  /** e.g. `2 × General admission`. */
  ticketsLabel: string
  /** e.g. `You're 3rd in line`. */
  place: string
}

/** What the success step says once the order exists. */
export interface PlacedOrder {
  /** Where the buyer's own copy of this order lives — no account needed. */
  orderId: string
  reference: string
  eventName: string
  buyerEmail: string
  /** How many were bought — not how many have been minted yet. */
  ticketCount: number
  total: string
  paymentRequired: boolean
  /** Placed, but waiting for the organizer — not registered yet (US-REG-02). */
  awaitingApproval: boolean
}

/** `POST /public/payments` — the payment the API started, verbatim. */
export interface PaymentIntentWire {
  paymentId: string
  orderId: string
  method: string
  status: string
  amountSatang: number
  amountLabel: string
  /** Where the provider's own hosted fields take over, for Card. */
  clientSecret: string | null
  /** Card only — the provider's own payment page. */
  checkoutUrl: string | null
  promptPayQr: string | null
  expiresAt: string | null
  declineReason: string | null
}

/**
 * What the buyer has to do next.
 *
 * Never "paid": starting a payment is not completing one. The money arrives
 * out of band — a QR scanned in a banking app, or the provider's own fields —
 * and the API learns of it separately.
 */
export interface PaymentStep {
  state: 'scan' | 'provider' | 'failed'
  amount: string
  promptPayQr: string | null
  /**
   * Where the buyer is sent to pay (card only).
   *
   * A page on the provider's own domain — so this app needs no key, no
   * connected-account id and no SDK, which is what keeps a multi-tenant
   * checkout simple as well as SAQ-A.
   */
  checkoutUrl: string | null
  declineReason: string | null
}
