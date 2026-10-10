import { describe, expect, it } from 'vitest'
import {
  placeInLine,
  prefillsFromProfile,
  toBuyerDefaults,
  toCheckoutView,
  toPaymentStep,
  toPlacedOrder,
  toSummaryLines,
  toWaitlistPlace,
  type TicketStatusWire,
} from './checkout.mapper'
import type {
  CheckoutTierWire,
  CheckoutViewWire,
  OrderPlacedWire,
  OrderSummaryWire,
  PaymentIntentWire,
} from './checkout.types'
import type { ProfileWire } from './profile.types'

/**
 * Every value the `ticket_status` pgEnum (`eventa-api/src/db/schema/enums.ts`)
 * can put on the wire, copied verbatim from it and republished by
 * `CheckoutTierDto` as `@ApiProperty({ enum: ticketStatusEnum.enumValues })`.
 *
 * Literals rather than a list derived from this repo's own union, because the
 * union is the thing that drifts — derived from it, this test would only ever
 * test itself. `satisfies` ties the two together, so a value the API adds
 * cannot be listed here without being added to the union as well.
 */
const API_TICKET_STATUSES = [
  'onsale',
  'scheduled',
  'paused',
  'soldout',
] as const satisfies readonly TicketStatusWire[]

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
  waitlist: false,
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
  notes: { seating: 'Seating is first-come, first-served.', delivery: null, approval: null },
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

    // What the buyer is told about each of the four, and nothing else: the API
    // decides selectability with `status === 'onsale'` exactly
    // (`checkout-view.service.ts`), so the other three always arrive with
    // `canSelect: false` and must each find their own words.
    const REASON: Record<TicketStatusWire, string | null> = {
      onsale: null,
      scheduled: 'Not on sale yet',
      paused: 'Paused',
      soldout: 'Sold out',
    }

    it.each(API_TICKET_STATUSES)('tells a buyer what %s means', (status) => {
      expect(tier({ status, canSelect: status === 'onsale' }).unavailableReason).toBe(
        REASON[status],
      )
    })

    // A status nobody has taught this page about must not read as available.
    it('falls back to a plain refusal for an unknown status', () => {
      expect(tier({ canSelect: false, status: 'something-new' })).toMatchObject({
        selectable: false,
        unavailableReason: 'Unavailable',
      })
    })

    // `ended` and `retired` were invented here and have never existed in the
    // `ticket_status` enum: the API derives a closed sales window back to
    // `onsale` (`ticketing.policy.ts` `resolveStatus`) and a retired tier is
    // soft-deleted out of the catalog altogether. Copy for a value the API
    // cannot send is copy nobody proof-reads, so they must read as the unknown
    // statuses they are.
    it.each(['ended', 'retired'])('treats %s as a status it does not know', (status) => {
      expect(tier({ canSelect: false, status }).unavailableReason).toBe('Unavailable')
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

  // US-REG-02: a buyer pays first on an approval event, so they are told
  // before they pay that the organizer decides — and what a "no" means.
  it('says an event requires approval, before anybody pays', () => {
    const note =
      "The organizer reviews each registration before confirming it. If yours isn't approved, any payment is refunded in full."
    expect(
      view({ notes: { seating: null, delivery: null, approval: note } }).notes,
    ).toEqual([note])
  })

  it('keeps only the notes the organizer actually wrote', () => {
    expect(view().notes).toEqual(['Seating is first-come, first-served.'])
    expect(view({ notes: { seating: null, delivery: null, approval: null } }).notes).toEqual([])
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

describe('the waitlist (US-REG-04)', () => {
  const soldOut = { status: 'soldout', canSelect: false, remaining: 0 }

  it('lets a sold-out ticket be chosen when its waitlist is open', () => {
    const option = tier({ ...soldOut, waitlist: true })
    expect(option.waitlist).toBe(true)
    expect(option.selectable).toBe(false)
    expect(option.unavailableReason).toBe('Sold out · join the waitlist')
  })

  it('does not cap the request at the none that are left', () => {
    // Nothing is left by definition; how many they want to wait for is the
    // tier's own limit.
    expect(tier({ ...soldOut, waitlist: true }).maxPerOrder).toBe(8)
  })

  it('leaves a sold-out ticket with no waitlist simply sold out', () => {
    const option = tier(soldOut)
    expect(option.waitlist).toBe(false)
    expect(option.unavailableReason).toBe('Sold out')
  })

  describe('placeInLine', () => {
    it('calls the front of the line next', () => {
      expect(placeInLine(1)).toBe("You're next in line")
    })

    it('counts everybody else ordinally', () => {
      expect(placeInLine(2)).toBe("You're 2nd in line")
      expect(placeInLine(3)).toBe("You're 3rd in line")
      expect(placeInLine(4)).toBe("You're 4th in line")
      expect(placeInLine(11)).toBe("You're 11th in line")
      expect(placeInLine(22)).toBe("You're 22nd in line")
    })
  })

  it('says where the buyer now stands', () => {
    expect(
      toWaitlistPlace({
        orderId: 'o-1',
        reference: 'ORD-AAAA1111',
        eventName: 'Founders Coffee Connect',
        ticketTypeName: 'General admission',
        quantity: 2,
        position: 3,
      }),
    ).toEqual({
      orderId: 'o-1',
      reference: 'ORD-AAAA1111',
      eventName: 'Founders Coffee Connect',
      ticketsLabel: '2 × General admission',
      place: "You're 3rd in line",
    })
  })
})

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
  awaitingApproval: false,
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
      awaitingApproval: false,
    })
  })

  // US-REG-02: a free registration on an event that requires approval waits
  // for the organizer — placed, but neither registered nor owing anything.
  it('knows a registration is waiting for the organizer’s approval', () => {
    expect(
      placed({ paymentRequired: false, awaitingApproval: true, tickets: [] }).awaitingApproval,
    ).toBe(true)
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

/* ── pre-filling the buyer boxes (US-DISC-11, criterion 5) ───────────────── */

const SAVED: ProfileWire = {
  id: 'user-7',
  name: 'Anan Suksawat',
  email: 'anan@example.com',
  pendingEmail: null,
  emailVerified: true,
  phone: '+66 81 234 5678',
  phoneVerified: false,
  pendingPhone: null,
  timezone: 'Asia/Bangkok',
  locale: 'th',
  avatarUrl: null,
  city: 'Bangkok',
  dateOfBirth: '1995-04-12',
  bio: null,
  displayCurrency: null,
}

const EMPTY = { name: '', email: '', phone: '' }

describe('toBuyerDefaults (US-DISC-11, criterion 5)', () => {
  it('fills the buyer boxes from the saved profile', () => {
    expect(toBuyerDefaults('attendee', SAVED)).toEqual({
      name: 'Anan Suksawat',
      email: 'anan@example.com',
      phone: '+66 81 234 5678',
    })
  })

  // Checkout is open to guests (US-ACC-03) and a guest has no saved profile to
  // read. Empty strings are what leaves their page exactly as it is today.
  it('leaves a guest the empty boxes they have today', () => {
    expect(toBuyerDefaults(null, null)).toEqual(EMPTY)
  })

  // The loader fetches a profile for nobody else, so this pairing should not
  // arise — but the rule refuses it rather than trusting that, because the
  // failure mode is one person's name and email in another person's checkout.
  it('ignores a profile that arrived without an attendee session', () => {
    expect(toBuyerDefaults(null, SAVED)).toEqual(EMPTY)
    expect(toBuyerDefaults('admin', SAVED)).toEqual(EMPTY)
  })

  // `null` is not the string "null". A phone nobody gave is a box nobody
  // filled, which the placeholder goes on describing as usual.
  it('renders a phone nobody gave as an empty box', () => {
    expect(toBuyerDefaults('attendee', { ...SAVED, phone: null }).phone).toBe('')
  })

  // Checkout is the money path: a pre-fill that could not be read costs three
  // fields of typing, never the sale.
  it('leaves the boxes empty when the profile could not be read', () => {
    expect(toBuyerDefaults('attendee', null)).toEqual(EMPTY)
  })

  // The ticket has to reach an inbox that works. A change of address is not
  // done until it is confirmed (criterion 2), so the address that signs in is
  // the one pre-filled — `pendingEmail` is one nobody has answered yet.
  it('uses the address that signs in, not one awaiting confirmation', () => {
    const moving = { ...SAVED, pendingEmail: 'anan@newmail.com', emailVerified: false }
    expect(toBuyerDefaults('attendee', moving).email).toBe('anan@example.com')
  })
})

describe('prefillsFromProfile (US-DISC-11, criterion 5)', () => {
  it('reads the saved profile of a signed-in attendee', () => {
    expect(prefillsFromProfile('attendee')).toBe(true)
  })

  // The decisive case. `/me/profile` needs a token, and the checkout loader is
  // public: asked for it unconditionally, every guest's registration page would
  // reject with a 401 and render React Router's error element instead.
  it('asks for nothing when nobody is signed in', () => {
    expect(prefillsFromProfile(null)).toBe(false)
  })

  // Two personas, never a shared login. An organizer token proves who runs a
  // workspace, not who is buying this ticket, so it pre-fills nothing.
  it('does not read an organizer session', () => {
    expect(prefillsFromProfile('admin')).toBe(false)
  })
})
