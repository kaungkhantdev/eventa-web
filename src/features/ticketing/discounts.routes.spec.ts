import { describe, expect, it } from 'vitest'
import { discountInputOf, listQueryOf, tabOf } from './discounts.routes'

describe('tabOf', () => {
  it('lists every code until a status is asked for', () => {
    expect(tabOf(new URLSearchParams())).toBe('all')
    expect(tabOf(new URLSearchParams('tab=expired'))).toBe('expired')
  })

  it('ignores a status the API has never heard of', () => {
    expect(tabOf(new URLSearchParams('tab=lapsed'))).toBe('all')
  })
})

describe('listQueryOf', () => {
  it('carries the tab, the event and the search into the request', () => {
    const query = listQueryOf(new URLSearchParams('tab=active&eventId=e-1&q=early'))

    expect(query).toMatchObject({ status: 'active', eventId: 'e-1', search: 'early' })
  })

  it('asks for no status on the All tab', () => {
    expect(listQueryOf(new URLSearchParams()).status).toBeUndefined()
  })
})

describe('discountInputOf', () => {
  const form = (fields: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.append(key, value)
    return data
  }

  it('keeps a percentage as a percentage', () => {
    const input = discountInputOf(form({ code: 'SAVE25', type: 'percent', value: '25' }))

    expect(input).toMatchObject({ type: 'percent', value: 25 })
  })

  // Everything on this wire is satang. A fixed ฿200 code sent as 200 would be
  // ฿2 off — the same class of mistake in the opposite direction.
  it('sends a fixed discount as integer satang', () => {
    const input = discountInputOf(form({ code: 'OFF200', type: 'fixed', value: '200' }))

    expect(input.value).toBe(20_000)
  })

  it('uppercases the code, since that is how it is typed at checkout', () => {
    expect(discountInputOf(form({ code: ' summer25 ', type: 'percent', value: '10' })).code).toBe(
      'SUMMER25',
    )
  })

  // An empty event select is the workspace-wide scope, and the API spells that
  // null. Sending '' would be a lookup for an event with no id.
  it('applies a code to every event when none is chosen', () => {
    expect(discountInputOf(form({ code: 'X', type: 'percent', value: '5' })).eventId).toBeNull()
  })

  it('reads the validity window as Bangkok days', () => {
    const input = discountInputOf(
      form({ code: 'X', type: 'percent', value: '5', validFrom: '2026-06-01' }),
    )

    expect(input.validFrom).toBe('2026-05-31T17:00:00.000Z')
    expect(input.validUntil).toBeUndefined()
  })
})
