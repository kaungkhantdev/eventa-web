import { describe, expect, it } from 'vitest'
import { toTicketCard } from './tickets.mapper'
import { listQueryOf, tabCountsOf, tabOf, ticketInputOf } from './tickets.routes'
import type { TicketWire } from './tickets.types'

describe('tabOf', () => {
  it('shows every tier until a status is asked for', () => {
    expect(tabOf(new URLSearchParams())).toBe('all')
    expect(tabOf(new URLSearchParams('tab=paused'))).toBe('paused')
  })

  it('ignores a status the API has never heard of', () => {
    expect(tabOf(new URLSearchParams('tab=burned'))).toBe('all')
  })
})

describe('listQueryOf', () => {
  it('asks for no status on the All tab, so every bucket is listed', () => {
    expect(listQueryOf(new URLSearchParams()).status).toBeUndefined()
  })

  it('carries the tab, the event and the search into the request', () => {
    const query = listQueryOf(new URLSearchParams('tab=onsale&eventId=e-1&q=vip&page=3'))

    expect(query).toMatchObject({ status: 'onsale', eventId: 'e-1', search: 'vip', page: 3 })
  })

  // The address bar is not a trusted input: a limit the API rejects would 400
  // the loader and show an error page where the inventory should be.
  it('falls back to a page size the API accepts', () => {
    expect(listQueryOf(new URLSearchParams('limit=9999')).limit).toBe(10)
  })
})

describe('tabCountsOf', () => {
  it('totals every status for the All pill', () => {
    const counts = tabCountsOf({ onsale: 23, scheduled: 2, paused: 1, soldout: 4 })

    expect(counts.all).toBe(30)
    expect(counts.onsale).toBe(23)
  })
})

describe('ticketInputOf', () => {
  const form = (fields: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.append(key, value)
    return data
  }

  it('sends money as integer satang, never the baht the organizer typed', () => {
    const input = ticketInputOf(form({ name: 'VIP', type: 'paid', price: '1250', total: '250' }))

    expect(input.priceSatang).toBe(125_000)
    expect(input.isFree).toBe(false)
  })

  it('prices a free tier at nothing, whatever is left in the price box', () => {
    const input = ticketInputOf(form({ name: 'Comp', type: 'free', price: '900', total: '50' }))

    expect(input).toMatchObject({ isFree: true, priceSatang: 0 })
  })

  // A rounded satang figure keeps the wire an integer: 1250.5 baht is not a
  // price anyone can pay, and a float would be rejected by the DTO.
  it('rounds a fractional price to whole satang', () => {
    expect(ticketInputOf(form({ name: 'X', type: 'paid', price: '10.005' })).priceSatang).toBe(1001)
  })

  it('leaves an unset sales window out rather than sending an empty string', () => {
    const input = ticketInputOf(form({ name: 'X', type: 'free', salesStartAt: '' }))

    expect(input.salesStartAt).toBeUndefined()
    expect(input.salesEndAt).toBeUndefined()
  })

  // The panel opens with the tier's own figures in these boxes, so an emptied
  // one is a box still being typed in. Sending 0 would price a paid tier at
  // nothing, or throw its allocation open, on a save nobody meant that way.
  it('leaves an emptied price and quantity out rather than reading them as 0', () => {
    const input = ticketInputOf(form({ name: 'X', type: 'paid', price: '', total: '' }))

    expect(input.priceSatang).toBeUndefined()
    expect(input.total).toBeUndefined()
  })

  it('still sends a price and a quantity of 0 when they are the answer typed', () => {
    const input = ticketInputOf(form({ name: 'X', type: 'paid', price: '0', total: '0' }))

    expect(input.priceSatang).toBe(0)
    expect(input.total).toBe(0)
  })

  // A box the browser degraded to plain text can carry anything; what cannot
  // be read is not a figure, and least of all zero.
  it('leaves an unreadable figure out rather than sending 0', () => {
    expect(ticketInputOf(form({ name: 'X', type: 'paid', price: 'soon' })).priceSatang).toBeUndefined()
  })

  // The day is unchanged, so the window is unchanged — down to the second the
  // organizer never saw and the date box could not have shown them.
  it('sends the stored instant back when its day is the one still in the box', () => {
    const input = ticketInputOf(
      form({ name: 'X', type: 'paid', salesEndAt: '2026-08-31', salesEndWas: '2026-08-31T16:59:59.000Z' }),
    )

    expect(input.salesEndAt).toBe('2026-08-31T16:59:59.000Z')
  })

  it('opens a day the organizer did move at Bangkok midnight', () => {
    const input = ticketInputOf(
      form({ name: 'X', type: 'paid', salesEndAt: '2026-09-01', salesEndWas: '2026-08-31T16:59:59.000Z' }),
    )

    expect(input.salesEndAt).toBe('2026-08-31T17:00:00.000Z')
  })

  it('sends the version back on an edit, so a stale write is refused', () => {
    expect(ticketInputOf(form({ name: 'X', type: 'free', version: '4' })).version).toBe(4)
  })

  // GUARD (green before this change — it pins behaviour rather than driving it).
  // `Number(null)` is 0, so only the `> 0` test stops a create from claiming to
  // hold version 0, which the API would read as a stale write.
  it('leaves the version out when the form carries none, rather than sending 0', () => {
    expect(ticketInputOf(form({ name: 'X', type: 'free' }))).not.toHaveProperty('version', 0)
    expect(ticketInputOf(form({ name: 'X', type: 'free' })).version).toBeUndefined()
  })
})

/**
 * The prefill and the submit are inverses.
 *
 * These import the mapper on purpose: what matters is not that either function
 * is right on its own, but that opening a tier and saving it untouched gives
 * the API back the figures it sent — the defect this change exists to fix.
 */
describe('the panel round-trip', () => {
  const form = (fields: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.append(key, value)
    return data
  }

  const wire = (over: Partial<TicketWire> = {}): TicketWire => ({
    id: 't-1',
    eventId: 'e-1',
    eventName: 'Tech Summit 2026',
    name: 'VIP Access',
    isFree: false,
    priceSatang: 290_000,
    vatRate: 0.07,
    status: 'onsale',
    sold: 210,
    total: 250,
    maxPerOrder: 4,
    salesStartAt: null,
    salesEndAt: null,
    version: 7,
    ...over,
  })

  /**
   * What the panel submits when the organizer opens a tier and changes nothing
   * — the visible boxes as they were filled in, the hidden instants the window
   * was opened with, and the version the row was read at.
   */
  const resubmitted = (row: TicketWire) => {
    const draft = toTicketCard(row).edit
    return ticketInputOf(
      form({
        name: draft.name,
        type: draft.isFree ? 'free' : 'paid',
        price: String(draft.price),
        total: String(draft.total),
        maxPerOrder: String(draft.maxPerOrder),
        salesStartAt: draft.salesStartDay,
        salesEndAt: draft.salesEndDay,
        salesStartWas: draft.salesStartAt,
        salesEndWas: draft.salesEndAt,
        version: String(draft.version),
      }),
    )
  }

  it.each([290_000, 125_000, 0])('returns a prefilled price of %i as the same satang', (satang) => {
    expect(resubmitted(wire({ priceSatang: satang })).priceSatang).toBe(satang)
  })

  // Bangkok midnight — the instant this form itself writes a window at.
  it('returns a prefilled sales window as the same instant', () => {
    const row = wire({
      salesStartAt: '2026-07-07T17:00:00.000Z',
      salesEndAt: '2026-08-31T17:00:00.000Z',
    })

    expect(resubmitted(row).salesStartAt).toBe(row.salesStartAt)
    expect(resubmitted(row).salesEndAt).toBe(row.salesEndAt)
  })

  // And any other time of day just the same: a date box shows the day, so a
  // window set anywhere but midnight — by an import, or by the API itself —
  // would otherwise be dragged back to 00:00 by a save that changed nothing,
  // closing sales up to a day early.
  it('returns a window set at any other hour as the same instant too', () => {
    const row = wire({
      salesStartAt: '2026-07-07T03:15:00.000Z',
      salesEndAt: '2026-08-31T16:59:59.000Z',
    })

    expect(resubmitted(row).salesStartAt).toBe(row.salesStartAt)
    expect(resubmitted(row).salesEndAt).toBe(row.salesEndAt)
  })

  // Both ends fall on one Bangkok day. Read as days alone they collapse onto
  // the same instant, and the API refuses a window that ends where it starts.
  it('keeps the two ends of a single-day window apart', () => {
    const row = wire({
      salesStartAt: '2026-07-07T17:00:00.000Z',
      salesEndAt: '2026-07-08T16:59:59.000Z',
    })
    const input = resubmitted(row)

    expect(input.salesStartAt).toBe(row.salesStartAt)
    expect(input.salesEndAt).toBe(row.salesEndAt)
  })

  it('leaves a tier with no sales window without one, rather than dating it today', () => {
    expect(resubmitted(wire()).salesStartAt).toBeUndefined()
    expect(resubmitted(wire()).salesEndAt).toBeUndefined()
  })

  // 0 is "unlimited" — a real answer the box carries back as itself, and the
  // one figure an emptied box must not be confused with.
  it.each([250, 0])('returns a prefilled allocation of %i unchanged', (total) => {
    expect(resubmitted(wire({ total })).total).toBe(total)
  })

  it('prices a free tier at nothing on the way back, as it arrived', () => {
    const input = resubmitted(wire({ isFree: true, priceSatang: 0 }))

    expect(input).toMatchObject({ isFree: true, priceSatang: 0 })
  })

  // The panel used to open this box blank, so an untouched save sent no key and
  // the cap survived only because the API reads an absent key as "unchanged".
  // Prefilled, it has to come back as the cap it opened with.
  it.each([1, 4, 8])('returns a prefilled per-order limit of %i unchanged', (max) => {
    expect(resubmitted(wire({ maxPerOrder: max })).maxPerOrder).toBe(max)
  })

  // The version is what makes an edit a reply to a particular read. Without it
  // on the wire the API has nothing to compare, and two organizers editing the
  // same tier simply overwrite each other with no one told.
  it('answers with the version the tier was read at, so a stale save is refused', () => {
    expect(resubmitted(wire({ version: 12 })).version).toBe(12)
  })
})
