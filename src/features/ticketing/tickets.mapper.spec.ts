import { describe, expect, it } from 'vitest'
import { toTicketCard } from './tickets.mapper'
import type { TicketWire } from './tickets.types'

const BAHT = 100

const wire = (over: Partial<TicketWire> = {}): TicketWire => ({
  id: 't-1',
  eventId: 'e-1',
  eventName: 'Tech Summit 2026',
  name: 'VIP Access',
  isFree: false,
  priceSatang: 2_900 * BAHT,
  vatRate: 0.07,
  status: 'onsale',
  sold: 210,
  total: 250,
  salesStartAt: null,
  salesEndAt: null,
  ...over,
})

describe('toTicketCard', () => {
  it('prices a paid tier in whole baht, from satang', () => {
    expect(toTicketCard(wire()).price).toBe('฿2,900')
  })

  // "Free" and "฿0" are different claims, and the kit gives free tiers a badge
  // rather than a price. `isFree` is the API's answer, not `priceSatang === 0`.
  it('says a free tier is free rather than pricing it at nothing', () => {
    const card = toTicketCard(wire({ isFree: true, priceSatang: 0 }))

    expect(card.isFree).toBe(true)
    expect(card.price).toBe('Free')
  })

  it('reads sold against the allocation, with the share filled', () => {
    const card = toTicketCard(wire())

    expect(card.soldLabel).toBe('210 / 250 sold')
    expect(card.percent).toBe(84)
  })

  // An allocation of 0 is the API's "unlimited". A progress bar against it
  // would read 0% forever, and "210 / 0 sold" is not a sentence.
  it('drops the bar for an unlimited allocation instead of dividing by zero', () => {
    const card = toTicketCard(wire({ total: 0, sold: 210 }))

    expect(card.soldLabel).toBe('210 sold')
    expect(card.percent).toBeNull()
  })

  it('never claims more than a full bar when a tier oversold', () => {
    expect(toTicketCard(wire({ sold: 260, total: 250 })).percent).toBe(100)
  })

  it('labels and tints each status', () => {
    expect(toTicketCard(wire({ status: 'soldout' })).statusLabel).toBe('Sold out')
    expect(toTicketCard(wire({ status: 'paused' })).statusTone).toBe('gray')
  })

  it('gives a tier the same icon tint on every visit', () => {
    expect(toTicketCard(wire()).iconTint).toBe(toTicketCard(wire()).iconTint)
  })
})
