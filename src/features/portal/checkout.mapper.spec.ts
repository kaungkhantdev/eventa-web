import { describe, expect, it } from 'vitest'
import { toCheckoutView, toPaymentStep, toPlacedOrder, toSummaryLines } from './checkout.mapper'
import type {
  CheckoutTierWire,
  CheckoutViewWire,
  OrderPlacedWire,
  OrderSummaryWire,
  PaymentIntentWire,
} from './checkout.types'

const TIER: CheckoutTierWire = {
  id: 'tier-ga',
  name: 'General admission',
  priceLabel: '฿1,500',
  priceSatang: 150_000,
  isFree: false,
  status: 'onsale',
  canSelect: true,
  minPerOrder: 1,
  maxPerOrder: 8,
  remaining: 80,
}

const VIEW: CheckoutViewWire = {
  event: {
    id: 'event-1',
    slug: 'founders-coffee-connect',
    name: 'Founders Coffee Connect',
    startAt: '2026-08-18T02:00:00.000Z',
    endAt: null,
    timezone: 'Asia/Bangkok',
    isOnline: false,
    venueName: 'Bangkok Convention Centre',
    venueAddress: null,
    city: 'Bangkok',
    coverImage: null,
    organizerName: 'Demo Workspace',
    seatingMode: 'ga',
  },
  tiers: [TIER],
  seatMap: null,
  notes: { seating: 'Seating is first-come, first-served.', delivery: null },
  maxPerBooking: 8,
  paymentRequired: true,
}

const view = (patch: Partial<CheckoutViewWire> = {}) => toCheckoutView({ ...VIEW, ...patch })
const tier = (patch: Partial<CheckoutTierWire> = {}) =>
  view({ tiers: [{ ...TIER, ...patch }] }).tiers[0]

describe('toCheckoutView', () => {
  it('heads the page with the event', () => {
    expect(view().header).toEqual({
      name: 'Founders Coffee Connect',
      when: 'Tue, Aug 18, 2026',
      where: 'Bangkok Convention Centre, Bangkok',
      organizer: 'Demo Workspace',
      backTo: '/landing/aurora?event=founders-coffee-connect',
    })
  })

  describe('mode', () => {
    it('is general admission when there are no assigned seats', () => {
      expect(view().mode).toBe('general')
    })

    it('is reserved when the event seats people', () => {
      const seated = {
        ...VIEW,
        event: { ...VIEW.event, seatingMode: 'reserved' },
        seatMap: { seats: [] },
      }
      expect(toCheckoutView(seated).mode).toBe('reserved')
    })

    // Online beats the seating mode: there is no room to sit in.
    it('is online when the event is', () => {
      expect(view({ event: { ...VIEW.event, isOnline: true } }).mode).toBe('online')
    })
  })

  describe('tiers', () => {
    it('shows the API’s own price label rather than deriving one', () => {
      expect(tier()).toMatchObject({ price: '฿1,500', isFree: false, selectable: true })
    })

    it('marks a free tier so it reads as one word', () => {
      expect(tier({ isFree: true, priceLabel: 'Free' })).toMatchObject({
        price: 'Free',
        isFree: true,
      })
    })

    it('says why a tier cannot be chosen', () => {
      expect(tier({ canSelect: false, status: 'soldout' })).toMatchObject({
        selectable: false,
        unavailableReason: 'Sold out',
      })
      expect(tier({ canSelect: false, status: 'paused' })).toMatchObject({
        unavailableReason: 'Paused',
      })
      expect(tier({ canSelect: false, status: 'scheduled' })).toMatchObject({
        unavailableReason: 'Not on sale yet',
      })
    })

    // A status nobody has taught this page about must not read as available.
    it('falls back to a plain refusal for an unknown status', () => {
      expect(tier({ canSelect: false, status: 'something-new' })).toMatchObject({
        selectable: false,
        unavailableReason: 'Unavailable',
      })
    })

    it('gives no reason when the tier can simply be bought', () => {
      expect(tier().unavailableReason).toBeNull()
    })

    describe('how many may be taken', () => {
      it('is the tier’s own limit when stock is ample', () => {
        expect(tier({ maxPerOrder: 8, remaining: 80 }).maxPerOrder).toBe(8)
      })

      it('is capped by what is actually left', () => {
        expect(tier({ maxPerOrder: 8, remaining: 3 }).maxPerOrder).toBe(3)
      })

      // `null` remaining is unlimited stock, not none.
      it('is the tier’s limit when the allocation is unlimited', () => {
        expect(tier({ maxPerOrder: 8, remaining: null }).maxPerOrder).toBe(8)
      })

      it('is capped by the event’s per-booking limit', () => {
        expect(view({ maxPerBooking: 2 }).tiers[0]!.maxPerOrder).toBe(2)
      })
    })
  })

  describe('seats', () => {
    const seated = (seats: CheckoutViewWire['seatMap']) =>
      toCheckoutView({ ...VIEW, event: { ...VIEW.event, seatingMode: 'reserved' }, seatMap: seats })

    it('groups seats into their rows', () => {
      const rows = seated({
        seats: [
          { id: 2, section: null, rowLabel: 'A', seatNumber: '2', ticketTypeId: null, available: true },
          { id: 1, section: null, rowLabel: 'A', seatNumber: '1', ticketTypeId: null, available: false },
          { id: 3, section: null, rowLabel: 'B', seatNumber: '1', ticketTypeId: null, available: true },
        ],
      }).rows
      expect(rows.map((row) => row.label)).toEqual(['A', 'B'])
      expect(rows[0]!.seats).toEqual([
        { id: 1, label: '1', available: false },
        { id: 2, label: '2', available: true },
      ])
    })

    // 2, 10, 11 — not 10, 11, 2, which is what a plain string sort gives.
    it('orders seats within a row numerically', () => {
      const rows = seated({
        seats: ['10', '2', '11'].map((seatNumber, index) => ({
          id: index,
          section: null,
          rowLabel: 'A',
          seatNumber,
          ticketTypeId: null,
          available: true,
        })),
      }).rows
      expect(rows[0]!.seats.map((seat) => seat.label)).toEqual(['2', '10', '11'])
    })

    it('files a seat with no row of its own under one heading', () => {
      const rows = seated({
        seats: [
          { id: 1, section: null, rowLabel: null, seatNumber: '1', ticketTypeId: null, available: true },
        ],
      }).rows
      expect(rows).toHaveLength(1)
      expect(rows[0]!.label).toBe('')
    })

    it('has no rows at all when the event does not seat people', () => {
      expect(view().rows).toEqual([])
    })
  })

  it('keeps only the notes the organizer actually wrote', () => {
    expect(view().notes).toEqual(['Seating is first-come, first-served.'])
    expect(view({ notes: { seating: null, delivery: null } }).notes).toEqual([])
  })
})

const SUMMARY: OrderSummaryWire = {
  eventId: 'event-1',
  ticketTypeId: 'tier-ga',
  ticketTypeName: 'General admission',
  quantity: 2,
  seatIds: null,
  unitPriceSatang: 150_000,
  subtotalSatang: 300_000,
  discountSatang: 0,
  serviceFeeSatang: 15_000,
  totalSatang: 315_000,
  netSatang: 294_393,
  vatSatang: 20_607,
  discountCode: null,
  labels: {
    subtotal: '฿3,000',
    discount: null,
    serviceFee: '฿150',
    total: '฿3,150',
  },
  paymentRequired: true,
}

describe('toSummaryLines', () => {
  const lines = (patch: Partial<OrderSummaryWire> = {}) =>
    toSummaryLines({ ...SUMMARY, ...patch })

  // Every figure is the server's. A total computed here could disagree with
  // the one actually charged.
  it('shows the API’s labels verbatim', () => {
    expect(lines()).toMatchObject({
      subtotal: '฿3,000',
      serviceFee: '฿150',
      total: '฿3,150',
    })
  })

  it('names what is being bought', () => {
    expect(lines().ticketsLabel).toBe('2 × General admission')
    expect(lines({ quantity: 1 }).ticketsLabel).toBe('1 × General admission')
  })

  it('leaves the discount row out when no code was applied', () => {
    expect(lines().discount).toBeNull()
  })

  it('shows the discount the API worked out when one was', () => {
    expect(lines({ discountCode: 'EARLY', labels: { ...SUMMARY.labels, discount: '-฿300' } }).discount)
      .toBe('-฿300')
  })
})

const PLACED: OrderPlacedWire = {
  orderId: 'order-1',
  reference: 'EVT-2026-0001',
  status: 'confirmed',
  paymentStatus: 'paid',
  eventName: 'Founders Coffee Connect',
  buyerEmail: 'anan@example.com',
  totalSatang: 315_000,
  vatSatang: 20_607,
  summary: SUMMARY,
  tickets: [
    { id: 't1', qrToken: 'a', holderName: null, ticketLabel: null, status: 'valid' },
    { id: 't2', qrToken: 'b', holderName: null, ticketLabel: null, status: 'valid' },
  ],
  paymentRequired: true,
}

describe('toPlacedOrder', () => {
  const placed = (patch: Partial<OrderPlacedWire> = {}) => toPlacedOrder({ ...PLACED, ...patch })

  it('reports what was booked', () => {
    expect(placed()).toEqual({
      // Carried so the "You're registered" screen can link to the buyer's own
      // copy of the order rather than to a sign-in they have no account for.
      orderId: 'order-1',
      reference: 'EVT-2026-0001',
      eventName: 'Founders Coffee Connect',
      buyerEmail: 'anan@example.com',
      ticketCount: 2,
      total: '฿3,150',
      paymentRequired: true,
    })
  })

  // A paid order is placed `pending` and its tickets are minted only once the
  // money arrives, so the confirm response carries none. Counting the array
  // would tell the buyer they had bought nothing.
  it('counts the tickets bought, not the ones already minted', () => {
    expect(placed({ tickets: [] }).ticketCount).toBe(2)
  })

  it('knows a free registration needs no payment', () => {
    expect(placed({ paymentRequired: false }).paymentRequired).toBe(false)
  })
})

const INTENT: PaymentIntentWire = {
  paymentId: 'pay-1',
  orderId: 'order-1',
  method: 'PromptPay',
  status: 'pending',
  amountSatang: 315_000,
  amountLabel: '฿3,150',
  clientSecret: null,
  checkoutUrl: null,
  promptPayQr: 'data:image/png;base64,abc',
  expiresAt: '2026-08-16T12:00:00.000Z',
  declineReason: null,
}

describe('toPaymentStep', () => {
  const step = (patch: Partial<PaymentIntentWire> = {}) => toPaymentStep({ ...INTENT, ...patch })

  it('hands a PromptPay buyer the QR to scan', () => {
    expect(step()).toEqual({
      state: 'scan',
      amount: '฿3,150',
      promptPayQr: 'data:image/png;base64,abc',
      checkoutUrl: null,
      declineReason: null,
    })
  })

  // Card is paid on the provider's OWN page. Carrying its URL is the whole of
  // what this app needs — no key, no account id, no SDK (PCI SAQ-A).
  it('carries the hosted page the buyer is sent to', () => {
    expect(
      step({
        method: 'Card',
        promptPayQr: null,
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_1',
      }),
    ).toMatchObject({
      state: 'provider',
      promptPayQr: null,
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_1',
    })
  })

  // A card attempt the provider could not start has nowhere to send anybody,
  // and the page must say so rather than forward them to a blank screen.
  it('has no page when the provider refused outright', () => {
    expect(step({ method: 'Card', status: 'failed', checkoutUrl: null })).toMatchObject({
      state: 'failed',
      checkoutUrl: null,
    })
  })

  it('reports a refusal in the provider’s own words', () => {
    expect(step({ status: 'failed', declineReason: 'Card was declined.' })).toMatchObject({
      state: 'failed',
      declineReason: 'Card was declined.',
    })
  })
})
