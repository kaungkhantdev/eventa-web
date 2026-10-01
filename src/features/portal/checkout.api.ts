import { api } from '@/lib/api'
import type {
  CheckoutHoldWire,
  CheckoutViewWire,
  OrderPlacedWire,
  OrderSummaryWire,
  PaymentIntentWire,
  WaitlistJoinedWire,
} from './checkout.types'

/**
 * Every call registering for an event makes (US-DISC-04/05/06).
 *
 * All public: booking never requires an account, and confirming as a guest
 * creates none.
 */

export interface Selection {
  eventId: string
  ticketTypeId: string
  quantity?: number
  seatIds?: number[]
}

export interface Buyer {
  name: string
  email: string
  phone?: string
}

export const checkoutApi = {
  view: (slug: string) => api.get<CheckoutViewWire>(`/public/checkout/${slug}`),

  /** The live total, worked out by the API — never in the browser. */
  quote: (body: Selection & { discountCode?: string; buyerEmail?: string }) =>
    api.post<OrderSummaryWire>('/public/checkout/quote', body),

  /** Take the stock off the shelf while the buyer finishes. */
  hold: (body: Selection) => api.post<CheckoutHoldWire>('/public/checkout/hold', body),

  release: (eventId: string, holdIds: number[]) =>
    api.delete<void>(`/public/checkout/hold`, { body: { eventId, holdIds } }),

  confirm: (
    body: Selection & {
      holdIds: number[]
      discountCode?: string
      buyer: Buyer
      idempotencyKey: string
    },
  ) => api.post<OrderPlacedWire>('/public/checkout/confirm', body),

  /**
   * Join a sold-out ticket's waitlist (US-REG-04). Nothing is held and nothing
   * is charged; the API prices the entry and answers with a place in line.
   */
  joinWaitlist: (body: {
    eventId: string
    ticketTypeId: string
    quantity: number
    buyer: Buyer
    idempotencyKey: string
  }) => api.post<WaitlistJoinedWire>('/public/checkout/waitlist', body),

  /**
   * Take the money.
   *
   * PCI SAQ-A: this app never sees a card. `method: 'Card'` hands off to the
   * provider, which owns the fields and the PAN; nothing here holds either.
   */
  pay: (body: { orderId: string; method: 'Card' | 'PromptPay'; idempotencyKey: string }) =>
    api.post<PaymentIntentWire>('/public/payments', body),
}
