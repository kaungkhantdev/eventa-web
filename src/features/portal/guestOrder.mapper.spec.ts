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
}

const order = (patch: Partial<GuestOrderWire> = {}) => toGuestOrder({ ...WIRE, ...patch })

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
    it('says the money is still owed while the order is pending', () => {
      expect(
        order({ status: 'pending', paymentStatus: 'pending', paymentRequired: true }),
      ).toMatchObject({
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
