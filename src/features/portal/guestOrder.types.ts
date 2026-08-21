/**
 * The buyer's own copy of their order (US-DISC-06/07) — reached by the order's
 * id alone, because registration never required an account.
 */

export interface GuestOrderLineWire {
  ticketTypeName: string
  quantity: number
  unitPriceSatang: number
  lineSubtotalSatang: number
}

export interface IssuedTicketWire {
  id: string
  /** The bearer credential the QR encodes. */
  qrToken: string
  holderName: string | null
  ticketLabel: string | null
  status: string
}

/** `GET /public/orders/{orderId}` — verbatim. */
export interface GuestOrderWire {
  orderId: string
  reference: string
  status: string
  paymentStatus: string
  eventName: string
  buyerEmail: string
  buyerName: string
  totalSatang: number
  vatSatang: number
  subtotalSatang: number
  discountSatang: number
  currency: string
  lines: GuestOrderLineWire[]
  tickets: IssuedTicketWire[]
  paymentRequired: boolean
  placedAt: string
  /** When the seats stop being held — the deadline to pay. */
  holdExpiresAt: string | null
}

/* ── what the page renders ────────────────────────────────────────────── */

export interface GuestOrderLine {
  name: string
  quantity: number
  each: string
  total: string
}

export interface GuestTicket {
  id: string
  qrToken: string
  holder: string
  label: string
}

/** How the order stands, in one word the buyer understands. */
export interface OrderState {
  label: string
  tone: 'green' | 'amber' | 'red' | 'gray'
  /** What happens next, when anything does. */
  detail: string
}

export interface GuestOrder {
  orderId: string
  reference: string
  eventName: string
  buyerName: string
  buyerEmail: string
  placedOn: string
  state: OrderState
  lines: GuestOrderLine[]
  subtotal: string
  /** `null` when nothing was taken off — not `฿0`. */
  discount: string | null
  vat: string
  total: string
  tickets: GuestTicket[]
  /** True while the money is still owed, so the page can say so plainly. */
  awaitingPayment: boolean
  /**
   * The instant the seats stop being held, ISO — `null` when none are.
   *
   * Raw rather than formatted because the page counts down against it, and a
   * deadline that only exists as "3:42 PM" cannot be subtracted from.
   */
  holdExpiresAt: string | null
  /**
   * True while a payment can still be started.
   *
   * Deliberately not just "unpaid": once the hold lapses the seats are back on
   * sale, and taking money for an order we can no longer honour only creates a
   * refund. The button goes away with the inventory.
   */
  payable: boolean
}
