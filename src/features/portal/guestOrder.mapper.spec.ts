import { describe, expect, it } from 'vitest'
import { toGuestOrder } from './guestOrder.mapper'
import type { GuestOrderWire } from './guestOrder.types'

const WIRE: GuestOrderWire = {
  orderId: 'o-1',
  reference: 'ORD-27VEEC7Y',
  status: 'confirmed',
  paymentStatus: 'paid',
  eventName: 'Founders Coffee Connect',
  buyerEmail: 'anan@example.test',
  buyerName: 'Anan Suksawat',
  totalSatang: 157_500,
  vatSatang: 10_304,
  subtotalSatang: 150_000,
  discountSatang: 0,
  currency: 'THB',
  lines: [
    {
      ticketTypeName: 'General admission',
      quantity: 1,
      unitPriceSatang: 150_000,
      lineSubtotalSatang: 150_000,
    },
  ],
  tickets: [
    { id: 't-1', qrToken: 'K7M2Q9XW', holderName: 'Anan Suksawat', ticketLabel: 'General', status: 'issued' },
  ],
  paymentRequired: false,
  placedAt: '2026-08-17T04:50:58.000Z',
  holdExpiresAt: null,
}

const NOW = new Date('2026-08-17T05:00:00.000Z')
/** The commonest unpaid shape: placed, nothing cleared, seats still held. */
const UNPAID: Partial<GuestOrderWire> = {
  status: 'pending',
  paymentStatus: 'pending',
  paymentRequired: true,
  tickets: [],
  holdExpiresAt: '2026-08-17T05:08:00.000Z',
}

const order = (patch: Partial<GuestOrderWire> = {}, now = NOW) =>
  toGuestOrder({ ...WIRE, ...patch }, now)

describe('toGuestOrder', () => {
  it('carries the order through', () => {
    expect(order()).toMatchObject({
      orderId: 'o-1',
      reference: 'ORD-27VEEC7Y',
      eventName: 'Founders Coffee Connect',
      buyerName: 'Anan Suksawat',
    })
  })

  it('formats the money at the edge, in Baht', () => {
    expect(order()).toMatchObject({ subtotal: '฿1,500', vat: '฿103', total: '฿1,575' })
  })

  // Nothing taken off is not a discount of zero — the row is simply absent.
  it('leaves the discount out when there was none', () => {
    expect(order().discount).toBeNull()
    expect(order({ discountSatang: 20_000 }).discount).toBe('฿200')
  })

  it('reads the placed date on the Bangkok calendar', () => {
    expect(order().placedOn).toBe('Aug 17, 2026')
  })

  describe('state', () => {
    it('is confirmed once the money has arrived', () => {
      expect(order()).toMatchObject({
        awaitingPayment: false,
        state: { label: 'Confirmed', tone: 'green' },
      })
    })

    // The one the buyer sees most often, and the one the kit never had a
    // screen for: placed, but nothing has cleared yet.
    it('says the money is still owed while the seats are held', () => {
      expect(order(UNPAID)).toMatchObject({
        awaitingPayment: true,
        state: { label: 'Awaiting payment', tone: 'amber' },
      })
    })

    it('says so when the order was cancelled', () => {
      expect(order({ status: 'cancelled' }).state).toMatchObject({
        label: 'Cancelled',
        tone: 'red',
      })
    })

    it('says so when the money came back', () => {
      expect(order({ paymentStatus: 'refunded' }).state).toMatchObject({
        label: 'Refunded',
        tone: 'gray',
      })
    })

    // Nobody paid and the clock ran out. Distinct from Cancelled, which is a
    // decision somebody made — and the copy has to tell them what to do next,
    // because refreshing this page will never change it.
    it('says the order expired once the API has swept it', () => {
      expect(order({ ...UNPAID, status: 'expired', holdExpiresAt: null }).state).toMatchObject({
        label: 'Expired',
        tone: 'gray',
      })
    })

    /**
     * The gap between the hold lapsing and the sweep closing the order. The
     * server still says `pending`, but the seats went back on sale the moment
     * `holdExpiresAt` passed — so this must not keep promising tickets.
     */
    it('reads a lapsed hold as expired before the server has caught up', () => {
      expect(order({ ...UNPAID, holdExpiresAt: '2026-08-17T04:59:00.000Z' }).state).toMatchObject({
        label: 'Expired',
        tone: 'gray',
      })
    })
  })

  describe('on the waitlist (US-REG-04)', () => {
    const WAITING: Partial<GuestOrderWire> = {
      status: 'waitlisted',
      paymentStatus: 'pending',
      paymentRequired: true,
      tickets: [],
      holdExpiresAt: null,
    }

    it('says they are waiting — not that an order expired', () => {
      // No hold and nothing paid is exactly what a lapsed order looks like;
      // a waitlist entry has never had either, and has not lapsed.
      expect(order(WAITING).state).toMatchObject({ label: 'On the waitlist', tone: 'amber' })
      expect(order(WAITING).onWaitlist).toBe(true)
    })

    it('owes nothing yet, and offers nothing to pay', () => {
      expect(order(WAITING)).toMatchObject({ awaitingPayment: false, payable: false })
    })

    it('becomes an ordinary unpaid order once a seat is offered', () => {
      const offered = order({ ...UNPAID, holdExpiresAt: '2026-08-18T05:00:00.000Z' })
      expect(offered).toMatchObject({ onWaitlist: false, payable: true })
      expect(offered.state.label).toBe('Awaiting payment')
    })
  })

  describe('payable', () => {
    it('is true while the money is owed and the seats are still held', () => {
      expect(order(UNPAID)).toMatchObject({
        payable: true,
        holdExpiresAt: '2026-08-17T05:08:00.000Z',
      })
    })

    it('is false once the hold has lapsed — the seats are gone', () => {
      expect(order({ ...UNPAID, holdExpiresAt: '2026-08-17T04:59:00.000Z' }).payable).toBe(false)
    })

    // Taking money for an order we can no longer honour would mean refunding it.
    it('is false once the API has expired the order', () => {
      expect(order({ ...UNPAID, status: 'expired' }).payable).toBe(false)
    })

    it('is false when there is nothing left to pay', () => {
      expect(order().payable).toBe(false)
    })

    // An organizer-entered registration is on no clock at all (US-REG-03).
    it('is false when no hold was ever taken', () => {
      expect(order({ ...UNPAID, holdExpiresAt: null }).payable).toBe(false)
    })
  })

  describe('lines', () => {
    it('names the tier and prices it', () => {
      expect(order().lines).toEqual([
        { name: 'General admission', quantity: 1, each: '฿1,500', total: '฿1,500' },
      ])
    })

    it('reads a free tier as Free rather than ฿0', () => {
      const free = order({
        lines: [
          {
            ticketTypeName: 'RSVP',
            quantity: 2,
            unitPriceSatang: 0,
            lineSubtotalSatang: 0,
          },
        ],
      })
      expect(free.lines[0]).toMatchObject({ each: 'Free', total: 'Free' })
    })
  })

  describe('tickets', () => {
    it('hands over each ticket with its code', () => {
      expect(order().tickets).toEqual([
        { id: 't-1', qrToken: 'K7M2Q9XW', holder: 'Anan Suksawat', label: 'General' },
      ])
    })

    // A ticket names nobody until somebody assigns it; the buyer's own name is
    // the honest stand-in, since they are who bought it.
    it('falls back to the buyer when a ticket names nobody', () => {
      const anon = order({
        tickets: [
          { id: 't-2', qrToken: 'Q1', holderName: null, ticketLabel: null, status: 'issued' },
        ],
      })
      expect(anon.tickets[0]).toMatchObject({ holder: 'Anan Suksawat', label: 'Admission' })
    })

    it('is empty while the order is unpaid, rather than inventing one', () => {
      expect(order({ tickets: [], paymentRequired: true }).tickets).toEqual([])
    })
  })
})
