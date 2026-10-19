import { describe, expect, it } from 'vitest'
import { swatchOf } from '@/lib/seatSwatches'
import {
  quantityColumnOf,
  quantityFromSeatsOf,
  rowTicketTypesFor,
  rowTicketTypesOf,
  rowTypeOf,
  rowSwatchesOf,
  seatLegend,
  seatRowCount,
  seatingWaitsForRowTypes,
  seatsOfType,
  storedQuantityOf,
  ticketTypeChoices,
  toReservedSeatingBody,
  withRowType,
  type TicketTypeChoice,
} from './eventSeating.mapper'
import {
  toEventFormValues,
  toTicketBody,
  type EventFormValues,
  type QuantityFacts,
  type TicketDraft,
} from './eventForm.mapper'

/**
 * US-EVT-05: a reserved seat map is split between ticket types by whole rows.
 * The API names rows "1".."N" and takes one entry per row, index 0 = row 1.
 */

const VIP: TicketTypeChoice = { id: 'tier-vip', name: 'VIP' }
const GA: TicketTypeChoice = { id: 'tier-ga', name: 'General' }

const draft = (over: Partial<TicketDraft> = {}): TicketDraft => ({
  id: 'tier-vip',
  name: 'VIP',
  price: '3500',
  quantity: '40',
  isFree: false,
  ...over,
})

describe('rowTicketTypesOf — what GET /seating says each row sells', () => {
  it('puts each row’s type at its row number', () => {
    const rows = [
      { rowLabel: '1', ticketTypeId: 'tier-vip', seats: 16 },
      { rowLabel: '2', ticketTypeId: null, seats: 16 },
      { rowLabel: '3', ticketTypeId: 'tier-ga', seats: 16 },
    ]
    expect(rowTicketTypesOf(rows, 3)).toEqual(['tier-vip', null, 'tier-ga'])
  })

  it('reads the row number, not the order the rows arrived in', () => {
    const rows = [
      { rowLabel: '10', ticketTypeId: 'tier-ga', seats: 4 },
      { rowLabel: '2', ticketTypeId: 'tier-vip', seats: 4 },
    ]
    const types = rowTicketTypesOf(rows, 10)
    expect(types[1]).toBe('tier-vip')
    expect(types[9]).toBe('tier-ga')
  })

  it('gives a row the API did not list no type', () => {
    expect(rowTicketTypesOf([], 2)).toEqual([null, null])
  })

  it('ignores a row that is not on the map', () => {
    const rows = [{ rowLabel: '5', ticketTypeId: 'tier-vip', seats: 4 }]
    expect(rowTicketTypesOf(rows, 2)).toEqual([null, null])
  })
})

describe('seatRowCount — how many rows the save will send', () => {
  it('is the number typed', () => {
    expect(seatRowCount('7')).toBe(7)
  })

  // The save sends 1 for a blank box, so the list must have one row too.
  it('is one row when the box is blank or not a number', () => {
    expect(seatRowCount('')).toBe(1)
    expect(seatRowCount('abc')).toBe(1)
  })

  it('stops at the API’s own ceiling of 100 rows', () => {
    expect(seatRowCount('100000')).toBe(100)
  })
})

describe('ticketTypeChoices — the types a row can be given', () => {
  it('offers the saved ticket types, in their order', () => {
    expect(ticketTypeChoices([draft(), draft({ id: 'tier-ga', name: 'General' })])).toEqual([VIP, GA])
  })

  // A row can only point at a type the API has stored.
  it('leaves out a ticket type that has not been saved yet', () => {
    expect(ticketTypeChoices([draft({ id: null, name: 'Student' })])).toEqual([])
  })
})

describe('rowTypeOf — the select’s value', () => {
  it('reads a ticket type id, and "No ticket type" as none', () => {
    expect(rowTypeOf('tier-vip')).toBe('tier-vip')
    expect(rowTypeOf('')).toBeNull()
  })
})

describe('withRowType — giving one row a type', () => {
  it('sets that row and leaves the others', () => {
    expect(withRowType(['tier-vip', null], 1, 'tier-ga')).toEqual(['tier-vip', 'tier-ga'])
  })

  it('can give a row past the end a type, with the rows between it left without one', () => {
    expect(withRowType([], 2, 'tier-ga')).toEqual([null, null, 'tier-ga'])
  })

  it('does not change the list it was given', () => {
    const before = ['tier-vip']
    withRowType(before, 0, null)
    expect(before).toEqual(['tier-vip'])
  })
})

describe('rowTicketTypesFor — what the list shows and the save sends', () => {
  it('has exactly one entry per row', () => {
    expect(rowTicketTypesFor(['tier-vip'], 3, [VIP])).toEqual(['tier-vip', null, null])
    expect(rowTicketTypesFor(['tier-vip', 'tier-vip', 'tier-vip'], 2, [VIP])).toEqual([
      'tier-vip',
      'tier-vip',
    ])
  })

  it('gives no type to a row whose type is no longer on the event', () => {
    expect(rowTicketTypesFor(['tier-gone', 'tier-vip'], 2, [VIP])).toEqual([null, 'tier-vip'])
  })
})

describe('rowSwatchesOf — each row’s colour in the preview', () => {
  it('colours a row by its type’s place in the list, and an untyped row not at all', () => {
    expect(rowSwatchesOf(['tier-ga', null, 'tier-vip'], [VIP, GA])).toEqual([1, null, 0])
  })

  /*
   * US-PAGE-05: the public page colours a type by the shared rule, `swatchOf`,
   * over the event's types in the order they were created — the order the
   * wizard lists them in — so a type is one colour in both places.
   */
  it('colours each row as the public page does', () => {
    const rows = ['tier-ga', null, 'tier-vip', 'tier-gone']
    const byCreation = [VIP.id, GA.id]
    expect(rowSwatchesOf(rows, [VIP, GA])).toEqual(rows.map((row) => swatchOf(row, byCreation)))
  })
})

describe('seatLegend — the preview’s key', () => {
  it('names each type with the seats its rows hold', () => {
    const legend = seatLegend(['tier-vip', 'tier-ga', 'tier-ga'], [VIP, GA], 16)
    expect(legend).toEqual([
      { ticketTypeId: 'tier-vip', label: 'VIP · 16 seats', swatch: 0 },
      { ticketTypeId: 'tier-ga', label: 'General · 32 seats', swatch: 1 },
    ])
  })

  // Publishing needs every type to have a row, so a type with none is shown.
  it('shows a type with no rows as holding no seats', () => {
    expect(seatLegend(['tier-vip'], [VIP, GA], 4)[1]!.label).toBe('General · 0 seats')
  })

  it('adds the rows with no type, in the neutral colour', () => {
    const legend = seatLegend(['tier-vip', null], [VIP], 1)
    expect(legend).toEqual([
      { ticketTypeId: 'tier-vip', label: 'VIP · 1 seat', swatch: 0 },
      { ticketTypeId: null, label: 'No ticket type · 1 seat', swatch: null },
    ])
  })

  it('formats a large count for reading', () => {
    expect(seatLegend(Array(100).fill(null), [], 100)[0]!.label).toBe('No ticket type · 10,000 seats')
  })

  // The key's colours are the rows' colours, and the public page's (US-PAGE-05).
  it('keys each type in the colour the public page gives it', () => {
    const legend = seatLegend(['tier-vip', 'tier-ga', null], [VIP, GA], 16)
    const byCreation = [VIP.id, GA.id]
    expect(legend.map((entry) => entry.swatch)).toEqual([
      swatchOf(VIP.id, byCreation),
      swatchOf(GA.id, byCreation),
      swatchOf(null, byCreation),
    ])
  })
})

describe('toReservedSeatingBody — what PUT /seating/reserved is sent', () => {
  const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
    ...toEventFormValues(null, [], []),
    seatingMode: 'reserved',
    venueName: 'BITEC',
    seatMapName: 'Hall A',
    seatRows: '3',
    seatsPerRow: '16',
    rowTicketTypes: ['tier-vip', 'tier-ga', null],
    ...over,
  })

  it('sends the grid and each row’s ticket type', () => {
    expect(toReservedSeatingBody(values())).toEqual({
      name: 'Hall A',
      rows: 3,
      seatsPerRow: 16,
      rowTicketTypes: ['tier-vip', 'tier-ga', null],
    })
  })

  it('names the map after the venue when it has no name of its own', () => {
    expect(toReservedSeatingBody(values({ seatMapName: ' ' })).name).toBe('BITEC')
    expect(toReservedSeatingBody(values({ seatMapName: '', venueName: '' })).name).toBe('Main hall')
  })

  it('sends one row for a blank row count, as the list shows', () => {
    const body = toReservedSeatingBody(values({ seatRows: '', rowTicketTypes: [null] }))
    expect(body.rows).toBe(1)
    expect(body.rowTicketTypes).toHaveLength(1)
  })
})

/**
 * US-EVT-05: once a published event's rows have ticket types, the API refuses
 * a seat map with any row left untyped. A row added on Seating has none until
 * Assign seats, two steps on, so Seating must not be the one to send it.
 */
describe('seatingWaitsForRowTypes — whether the seat map must wait for Assign seats', () => {
  const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
    ...toEventFormValues(null, [], []),
    status: 'upcoming',
    seatingMode: 'reserved',
    seatRows: '3',
    seatsPerRow: '16',
    rowTicketTypes: ['tier-vip', 'tier-ga', 'tier-ga'],
    ...over,
  })

  it('waits on a published, typed map with a row added on Seating', () => {
    const grown = values({ seatRows: '4', rowTicketTypes: ['tier-vip', 'tier-ga', 'tier-ga', null] })
    expect(seatingWaitsForRowTypes(grown)).toBe(true)
  })

  it('does not wait once every row has a type', () => {
    expect(seatingWaitsForRowTypes(values())).toBe(false)
  })

  // A draft may leave rows open until it publishes.
  it('does not wait on a draft', () => {
    const draftMap = values({ status: 'draft', rowTicketTypes: ['tier-vip', null, null] })
    expect(seatingWaitsForRowTypes(draftMap)).toBe(false)
  })

  // Laid out before rows had types: it still sells as it always has.
  it('does not wait on a published map none of whose rows has a type', () => {
    expect(seatingWaitsForRowTypes(values({ rowTicketTypes: [null, null, null] }))).toBe(false)
  })

  it('does not wait for general admission or an online event', () => {
    const untyped = { rowTicketTypes: ['tier-vip', null, null] }
    expect(seatingWaitsForRowTypes(values({ ...untyped, seatingMode: 'ga' }))).toBe(false)
    expect(seatingWaitsForRowTypes(values({ ...untyped, isOnline: true }))).toBe(false)
  })
})

/**
 * US-EVT-05: once a reserved event's rows have ticket types, each type's
 * quantity is the seats its rows hold. The API says so on every ticket of
 * such an event as `quantityFromSeats`.
 */
describe('quantityFromSeatsOf — whether the seat map sets the quantities', () => {
  it('is true when the API says a ticket’s quantity comes from seats', () => {
    expect(quantityFromSeatsOf([{ quantityFromSeats: false }, { quantityFromSeats: true }])).toBe(true)
  })

  it('is false otherwise, and for an event with no tickets', () => {
    expect(quantityFromSeatsOf([{ quantityFromSeats: false }])).toBe(false)
    expect(quantityFromSeatsOf([])).toBe(false)
  })
})

/**
 * The seats a type's rows hold — the count behind the preview's key, which is
 * where each type's quantity shows while its rows are picked.
 */
describe('seatsOfType — the seats a type’s rows hold', () => {
  it('is the rows given that type times the seats in a row', () => {
    expect(seatsOfType(['tier-vip', 'tier-ga', 'tier-vip'], 'tier-vip', 16)).toBe(32)
  })

  it('is 0 for a type with no rows', () => {
    expect(seatsOfType(['tier-vip'], 'tier-ga', 16)).toBe(0)
  })

  it('counts the rows with no type when asked about none', () => {
    expect(seatsOfType(['tier-vip', null, null], null, 10)).toBe(20)
  })
})

/**
 * US-EVT-05, US-EVT-06: the wizard's Tickets step has a Quantity column only
 * where the organizer sets the quantity. On an in-person reserved event each
 * type's is the seats its rows hold, given on Assign seats, so there is no
 * column at all — the note under the list says so instead.
 */
describe('quantityColumnOf — whether the Tickets step shows a Quantity column, and how', () => {
  const event = (over: Partial<QuantityFacts> = {}): QuantityFacts => ({
    seatingMode: 'reserved',
    isOnline: false,
    quantityFromSeats: true,
    ...over,
  })

  it('is none for an in-person reserved event', () => {
    expect(quantityColumnOf(event())).toBe('none')
  })

  // Before any row has a type the API does not mark the tickets yet.
  it('is none for an in-person reserved event the API does not mark yet', () => {
    expect(quantityColumnOf(event({ quantityFromSeats: false }))).toBe('none')
  })

  it('is typed for general admission', () => {
    expect(quantityColumnOf(event({ seatingMode: 'ga', quantityFromSeats: false }))).toBe('typed')
  })

  it('is typed for an online event, which has no seat rows', () => {
    expect(quantityColumnOf(event({ isOnline: true, quantityFromSeats: false }))).toBe('typed')
  })

  /*
   * Switched away from reserved seating but not saved yet: the API still sets
   * the quantities from the old map and the save drops a typed one, so the
   * column shows what it stored, read-only.
   */
  it('is read-only while the API’s saved map still sets the quantity', () => {
    expect(quantityColumnOf(event({ seatingMode: 'ga' }))).toBe('readOnly')
    expect(quantityColumnOf(event({ isOnline: true }))).toBe('readOnly')
  })

  // A typed box the save then left out would throw the organizer's number away.
  it('is typed exactly when the save sends the quantity', () => {
    for (const seatingMode of ['ga', 'reserved'] as const)
      for (const isOnline of [false, true])
        for (const quantityFromSeats of [false, true]) {
          const facts = event({ seatingMode, isOnline, quantityFromSeats })
          expect(quantityColumnOf(facts) === 'typed').toBe('total' in toTicketBody(draft(), facts))
        }
  })
})

describe('storedQuantityOf — the read-only quantity a ticket row shows', () => {
  const saved = [draft({ id: 'tier-vip', quantity: '32' }), draft({ id: 'tier-ga', quantity: '16' })]

  it('is the number the API stored for that type', () => {
    expect(storedQuantityOf(saved, 'tier-ga')).toBe('16')
  })

  // A new type has no rows in the saved map, so no seats.
  it('is 0 for a type that has not been saved yet', () => {
    expect(storedQuantityOf(saved, null)).toBe('0')
    expect(storedQuantityOf([...saved, draft({ id: null, quantity: '999' })], null)).toBe('0')
  })
})
