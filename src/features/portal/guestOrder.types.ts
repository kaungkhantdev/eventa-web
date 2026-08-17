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
}
