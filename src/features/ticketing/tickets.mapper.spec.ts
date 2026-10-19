import { describe, expect, it } from 'vitest'
import { readOnlyQuantityOf, seatSetFor, toTicketCard } from './tickets.mapper'
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
  maxPerOrder: 4,
  salesStartAt: null,
  salesEndAt: null,
  version: 7,
  quantityFromSeats: false,
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

  // US-EVT-05: where the seat map sets the quantity, 0 is the seats a type's
  // rows hold — a type with no rows has none, which is not "unlimited".
  it('reads a seat-set quantity of 0 as no seats rather than unlimited', () => {
    const card = toTicketCard(wire({ quantityFromSeats: true, total: 0, sold: 0 }))

    expect(card.soldLabel).toBe('0 / 0 sold')
    expect(card.percent).toBe(0)
  })

  it('reads a seat-set quantity against its seats like any allocation', () => {
    const card = toTicketCard(wire({ quantityFromSeats: true, total: 80, sold: 20 }))

    expect(card.soldLabel).toBe('20 / 80 sold')
    expect(card.percent).toBe(25)
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

describe('toTicketCard — the edit draft', () => {
  // US-EVT-05: on a reserved event whose rows have ticket types, a tier's
  // quantity is the seats its rows hold, so the form shows it read-only.
  it('says when the quantity is set by the seat map', () => {
    expect(toTicketCard(wire({ quantityFromSeats: true })).edit.quantityFromSeats).toBe(true)
    expect(toTicketCard(wire()).edit.quantityFromSeats).toBe(false)
  })

  // The card's strings are for reading; the form needs figures it can put in a
  // number box and send back. Keeping them apart is what stops the panel from
  // parsing '฿2,900' back into a price.
  it("hands the edit form the tier's own figures, not the strings the card shows", () => {
    const card = toTicketCard(wire())

    expect(card.edit.price).toBe(2_900)
    expect(card.edit.total).toBe(250)
    expect(card.price).toBe('฿2,900')
  })

  // 20:00 UTC is already the next day in Bangkok, so the first ten characters
  // of the ISO string name the wrong day for every evening window.
  it("dates the sales window on the Bangkok clock, not the reader's", () => {
    const card = toTicketCard(wire({ salesStartAt: '2026-07-07T20:00:00Z' }))

    expect(card.edit.salesStartDay).toBe('2026-07-08')
  })

  // A date box holds a day and nothing finer, so the day alone cannot say what
  // time a window opens. The instant travels beside it, and is what goes back.
  it('keeps the stored instant beside the day the box shows', () => {
    const card = toTicketCard(wire({ salesEndAt: '2026-08-31T16:59:59.000Z' }))

    expect(card.edit.salesEndDay).toBe('2026-08-31')
    expect(card.edit.salesEndAt).toBe('2026-08-31T16:59:59.000Z')
  })

  it('leaves an unset window empty rather than inventing a date', () => {
    const card = toTicketCard(wire({ salesStartAt: null, salesEndAt: null }))

    expect(card.edit.salesStartDay).toBe('')
    expect(card.edit.salesEndDay).toBe('')
    expect(card.edit.salesStartAt).toBe('')
    expect(card.edit.salesEndAt).toBe('')
  })

  // 0 is the allocation "unlimited", a real answer the form has to carry back.
  it('carries an unlimited allocation as the 0 it is', () => {
    expect(toTicketCard(wire({ total: 0 })).edit.total).toBe(0)
  })

  // The per-order cap is a figure the organizer set and the panel must reopen
  // with; the version is the read this edit is answering. Both reach the draft
  // only because the inventory response now carries them.
  it("carries the tier's per-order cap and the version it was read at", () => {
    const card = toTicketCard(wire({ maxPerOrder: 6, version: 12 }))

    expect(card.edit.maxPerOrder).toBe(6)
    expect(card.edit.version).toBe(12)
  })
})

/**
 * US-EVT-05 / US-TKT-02: where the seat map sets an event's quantities, the
 * panel's quantity box is read-only — for a tier being edited and for a new
 * one alike. A new tier has no rows yet, so it has no seats.
 */
describe('readOnlyQuantityOf — the quantity the panel shows and cannot change', () => {
  it("is an edited tier's seats when the seat map sets them", () => {
    const editing = toTicketCard(wire({ quantityFromSeats: true, total: 32 })).edit

    expect(readOnlyQuantityOf(editing, false)).toBe(32)
  })

  it('is nothing — a typed quantity — for a tier the seat map does not set', () => {
    const editing = toTicketCard(wire({ total: 250 })).edit

    expect(readOnlyQuantityOf(editing, true)).toBeNull()
  })

  it('is 0 for a new tier on an event whose seat map sets quantities', () => {
    expect(readOnlyQuantityOf(null, true)).toBe(0)
  })

  it('is nothing for a new tier on any other event', () => {
    expect(readOnlyQuantityOf(null, false)).toBeNull()
  })
})

describe('seatSetFor — whether the chosen event takes quantities from its seat map', () => {
  it('is what the lookup answered for that event', () => {
    expect(seatSetFor('e-1', { eventId: 'e-1', quantityFromSeats: true })).toBe(true)
    expect(seatSetFor('e-1', { eventId: 'e-1', quantityFromSeats: false })).toBe(false)
  })

  // The panel keeps the last answer while the next event's is on its way.
  it("never takes another event's answer", () => {
    expect(seatSetFor('e-2', { eventId: 'e-1', quantityFromSeats: true })).toBe(false)
  })

  it('is false before any answer, or with no event chosen', () => {
    expect(seatSetFor('e-1', undefined)).toBe(false)
    expect(seatSetFor('', undefined)).toBe(false)
  })
})
