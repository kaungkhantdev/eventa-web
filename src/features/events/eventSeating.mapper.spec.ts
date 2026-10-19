import { describe, expect, it } from 'vitest'
import {
  rowTicketTypesFor,
  rowTicketTypesOf,
  rowTypeOf,
  rowSwatchesOf,
  seatLegend,
  seatRowCount,
  ticketTypeChoices,
  toReservedSeatingBody,
  withRowType,
  type TicketTypeChoice,
} from './eventSeating.mapper'
import { toEventFormValues, type EventFormValues, type TicketDraft } from './eventForm.mapper'

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
