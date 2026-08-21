import { describe, expect, it } from 'vitest'
import { listQueryOf, tabCountsOf, tabOf, ticketInputOf } from './tickets.routes'

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

  it('sends the version back on an edit, so a stale write is refused', () => {
    expect(ticketInputOf(form({ name: 'X', type: 'free', version: '4' })).version).toBe(4)
  })
})
