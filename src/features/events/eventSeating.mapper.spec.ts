import { describe, expect, it } from 'vitest'
import { swatchOf } from '@/lib/seatSwatches'
import { paintChoiceOf, paintOptionsOf, quantityColumnOf, quantityFromSeatsOf, rowChoiceOf, seatAriaLabel, seatLegend, seatRowCount, seatSwatchesOf, seatTicketTypesFor, seatTicketTypesOf, seatingWaitsForSeatTypes, seatsPerRowCount, storedQuantityOf, ticketTypeChoices, toReservedSeatingBody, typeOfChoice, withRowType, withSeatType, type TicketTypeChoice } from './eventSeating.mapper'
import {
  toEventFormValues,
  toTicketBody,
  type EventFormValues,
  type QuantityFacts,
  type TicketDraft,
} from './eventForm.mapper'
import { MIXED_ROW } from '@/lib/constants/events.constants'

/**
 * US-EVT-05: a reserved seat map is split between ticket types seat by seat —
 * a row's dropdown gives the whole row a type, and seats picked on the map
 * give just those seats one. The API numbers rows "1".."N" and takes one entry
 * per seat, `[row][seat]`, index 0 = row 1 and seat 1.
 */

const VIP: TicketTypeChoice = { id: 'tier-vip', name: 'VIP' }
const GA: TicketTypeChoice = { id: 'tier-ga', name: 'General' }
const FREE: TicketTypeChoice = { id: 'tier-free', name: 'Free' }
const NORMAL: TicketTypeChoice = { id: 'tier-normal', name: 'Normal' }

const draft = (over: Partial<TicketDraft> = {}): TicketDraft => ({
  id: 'tier-vip',
  name: 'VIP',
  price: '3500',
  quantity: '40',
  isFree: false,
  ...over,
})

const row = (seats: number, typeId: string | null): (string | null)[] => Array(seats).fill(typeId)

describe('seatTicketTypesOf — what GET /seating says each seat sells', () => {
  it('puts each seat’s type at its row and seat number', () => {
    const rows = [
      { rowLabel: '1', ticketTypeId: 'tier-vip', seats: 2, seatTicketTypes: ['tier-vip', 'tier-vip'] },
      { rowLabel: '2', ticketTypeId: null, seats: 2, seatTicketTypes: ['tier-ga', null] },
    ]
    expect(seatTicketTypesOf(rows, 2, 2)).toEqual([
      ['tier-vip', 'tier-vip'],
      ['tier-ga', null],
    ])
  })

  it('reads the row number, not the order the rows arrived in', () => {
    const rows = [
      { rowLabel: '3', ticketTypeId: 'tier-ga', seats: 1, seatTicketTypes: ['tier-ga'] },
      { rowLabel: '2', ticketTypeId: 'tier-vip', seats: 1, seatTicketTypes: ['tier-vip'] },
    ]
    expect(seatTicketTypesOf(rows, 3, 1)).toEqual([[null], ['tier-vip'], ['tier-ga']])
  })

  it('gives a row the API did not list no types', () => {
    expect(seatTicketTypesOf([], 2, 3)).toEqual([row(3, null), row(3, null)])
  })

  it('ignores a row that is not on the map, and seats past the end of a row', () => {
    const rows = [
      { rowLabel: '5', ticketTypeId: 'tier-vip', seats: 1, seatTicketTypes: ['tier-vip'] },
      { rowLabel: '1', ticketTypeId: null, seats: 3, seatTicketTypes: ['tier-vip', 'tier-ga', 'tier-ga'] },
    ]
    expect(seatTicketTypesOf(rows, 1, 2)).toEqual([['tier-vip', 'tier-ga']])
  })
})

describe('seatRowCount — how many rows the save will send', () => {
  it('is the number typed', () => {
    expect(seatRowCount('7')).toBe(7)
  })

  // The save sends 1 for a blank box, so the map must have one row too.
  it('is one row when the box is blank or not a number', () => {
    expect(seatRowCount('')).toBe(1)
    expect(seatRowCount('abc')).toBe(1)
  })

  it('stops at the API’s own ceiling of 100 rows', () => {
    expect(seatRowCount('100000')).toBe(100)
  })
})

describe('seatsPerRowCount — how many seats each row the save sends has', () => {
  it('is the number typed', () => {
    expect(seatsPerRowCount('16')).toBe(16)
  })

  it('is one seat when the box is blank or not a number', () => {
    expect(seatsPerRowCount('')).toBe(1)
    expect(seatsPerRowCount('abc')).toBe(1)
  })

  it('stops at the API’s own ceiling of 100 seats a row', () => {
    expect(seatsPerRowCount('500')).toBe(100)
  })
})

describe('ticketTypeChoices — the types a seat can be given', () => {
  it('offers the saved ticket types, in their order', () => {
    expect(ticketTypeChoices([draft(), draft({ id: 'tier-ga', name: 'General' })])).toEqual([VIP, GA])
  })

  // A seat can only point at a type the API has stored.
  it('leaves out a ticket type that has not been saved yet', () => {
    expect(ticketTypeChoices([draft({ id: null, name: 'Student' })])).toEqual([])
  })
})

describe('typeOfChoice — a row select’s or the paint picker’s value', () => {
  it('reads a ticket type id, and "No ticket type" as none', () => {
    expect(typeOfChoice('tier-vip')).toBe('tier-vip')
    expect(typeOfChoice('')).toBeNull()
  })
})

describe('withSeatType — giving one seat a type', () => {
  it('sets that seat and leaves every other', () => {
    expect(withSeatType([row(3, 'tier-ga')], 0, 1, 'tier-vip')).toEqual([['tier-ga', 'tier-vip', 'tier-ga']])
  })

  it('can give a seat past the end a type, with the seats between left without one', () => {
    expect(withSeatType([], 1, 2, 'tier-ga')).toEqual([[], [null, null, 'tier-ga']])
  })

  it('does not change the map it was given', () => {
    const before = [row(2, 'tier-vip')]
    withSeatType(before, 0, 0, null)
    expect(before).toEqual([row(2, 'tier-vip')])
  })
  // A drag paints every seat it enters, most of them already that type.
  it('hands back the same map when the seat already has that type', () => {
    const before = [row(2, 'tier-vip')]
    expect(withSeatType(before, 0, 1, 'tier-vip')).toBe(before)
  })
})

describe('withRowType — a row’s dropdown giving the whole row a type', () => {
  it('gives every seat of the row that type, and leaves the other rows', () => {
    const map = [row(3, 'tier-vip'), ['tier-free', 'tier-ga', null]]
    expect(withRowType(map, 1, 3, 'tier-ga')).toEqual([row(3, 'tier-vip'), row(3, 'tier-ga')])
  })

  it('can clear a row', () => {
    expect(withRowType([row(2, 'tier-vip')], 0, 2, null)).toEqual([row(2, null)])
  })

  it('can fill a row past the end, with the rows between left as they are', () => {
    expect(withRowType([], 1, 2, 'tier-ga')).toEqual([[], row(2, 'tier-ga')])
  })

  it('does not change the map it was given', () => {
    const before = [row(2, 'tier-vip')]
    withRowType(before, 0, 2, 'tier-ga')
    expect(before).toEqual([row(2, 'tier-vip')])
  })
})

describe('seatTicketTypesFor — what the map shows and the save sends', () => {
  it('has exactly one entry per seat of every row', () => {
    expect(seatTicketTypesFor([['tier-vip']], 2, 3, [VIP])).toEqual([
      ['tier-vip', null, null],
      row(3, null),
    ])
  })

  // US-EVT-05: changing Rows or Seats per row on Seating keeps every
  // surviving seat's type; the new seats start with none.
  it('keeps the seats that survive a smaller map, and gives a larger one’s new seats none', () => {
    const map = [row(3, 'tier-vip'), row(3, 'tier-ga')]
    expect(seatTicketTypesFor(map, 1, 2, [VIP, GA])).toEqual([row(2, 'tier-vip')])
    expect(seatTicketTypesFor(map, 3, 4, [VIP, GA])).toEqual([
      ['tier-vip', 'tier-vip', 'tier-vip', null],
      ['tier-ga', 'tier-ga', 'tier-ga', null],
      row(4, null),
    ])
  })

  it('gives no type to a seat whose type is no longer on the event', () => {
    expect(seatTicketTypesFor([['tier-gone', 'tier-vip']], 1, 2, [VIP])).toEqual([[null, 'tier-vip']])
  })
})

describe('rowChoiceOf — what a row’s dropdown shows', () => {
  it('shows the type every seat of the row shares', () => {
    expect(rowChoiceOf(row(4, 'tier-vip'))).toBe('tier-vip')
  })

  it('shows "No ticket type" for a row with none', () => {
    expect(rowChoiceOf(row(4, null))).toBe('')
  })

  it('shows Mixed for a row whose seats differ', () => {
    expect(rowChoiceOf(['tier-free', 'tier-normal'])).toBe(MIXED_ROW)
    expect(rowChoiceOf(['tier-vip', null])).toBe(MIXED_ROW)
  })

  // Not an option any ticket type could share a value with.
  it('is told apart from every type and from none', () => {
    expect(MIXED_ROW).not.toBe('')
    expect([VIP.id, GA.id]).not.toContain(MIXED_ROW)
  })
})

describe('seatSwatchesOf — each seat’s colour on the map', () => {
  it('colours a seat by its type’s place in the list, and an untyped seat not at all', () => {
    expect(seatSwatchesOf([['tier-ga', null, 'tier-vip']], [VIP, GA])).toEqual([[1, null, 0]])
  })

  /*
   * US-PAGE-05: the public page colours a type by the shared rule, `swatchOf`,
   * over the event's types in the order they were created — the order the
   * wizard lists them in — so a type is one colour in both places.
   */
  it('colours each seat as the public page does', () => {
    const seats = ['tier-ga', null, 'tier-vip', 'tier-gone']
    const byCreation = [VIP.id, GA.id]
    expect(seatSwatchesOf([seats], [VIP, GA])).toEqual([seats.map((seat) => swatchOf(seat, byCreation))])
  })
})

describe('seatLegend — the map’s key', () => {
  /** The owner's mock-up: rows 1–2 VIP, 3–6 Normal, row 7 seats 1–5 Free and 6–16 Normal. */
  const theatre = [
    row(16, VIP.id),
    row(16, VIP.id),
    row(16, NORMAL.id),
    row(16, NORMAL.id),
    row(16, NORMAL.id),
    row(16, NORMAL.id),
    [...row(5, FREE.id), ...row(11, NORMAL.id)],
  ]

  it('names each type in ticket order with where its seats are and how many', () => {
    expect(seatLegend(theatre, [FREE, NORMAL, VIP]).map((entry) => entry.label)).toEqual([
      'Free · Row 7 seats 1–5 · 5 seats',
      'Normal · Rows 3–6, row 7 seats 6–16 · 75 seats',
      'VIP · Rows 1–2 · 32 seats',
    ])
  })

  // Publishing needs every type to have a seat, so a type with none is shown.
  it('shows a type with no seats as holding none', () => {
    expect(seatLegend([row(4, VIP.id)], [VIP, GA])[1]!.label).toBe('General · 0 seats')
  })

  it('adds the seats with no type, in the neutral colour', () => {
    expect(seatLegend([[VIP.id, null]], [VIP])).toEqual([
      { ticketTypeId: VIP.id, label: 'VIP · Row 1 seat 1 · 1 seat', swatch: 0 },
      { ticketTypeId: null, label: 'No ticket type · 1 seat', swatch: null },
    ])
  })

  it('leaves the untyped entry out once every seat has a type', () => {
    expect(seatLegend(theatre, [FREE, NORMAL, VIP])).toHaveLength(3)
  })

  it('formats a large count for reading', () => {
    expect(seatLegend(Array.from({ length: 100 }, () => row(100, null)), [])[0]!.label).toBe(
      'No ticket type · 10,000 seats',
    )
  })

  // The key's colours are the seats' colours, and the public page's (US-PAGE-05).
  it('keys each type in the colour the public page gives it', () => {
    const legend = seatLegend([[VIP.id, GA.id, null]], [VIP, GA])
    const byCreation = [VIP.id, GA.id]
    expect(legend.map((entry) => entry.swatch)).toEqual([
      swatchOf(VIP.id, byCreation),
      swatchOf(GA.id, byCreation),
      swatchOf(null, byCreation),
    ])
  })
})

describe('paintOptionsOf — what the paint picker offers', () => {
  it('offers every saved type in its colour, then No ticket type', () => {
    expect(paintOptionsOf([VIP, GA])).toEqual([
      { value: VIP.id, label: 'VIP', swatch: 0 },
      { value: GA.id, label: 'General', swatch: 1 },
      { value: '', label: 'No ticket type', swatch: null },
    ])
  })
})

describe('paintChoiceOf — what the paint picker has picked', () => {
  it('starts on the first ticket type', () => {
    expect(paintChoiceOf(null, [VIP, GA])).toBe(VIP.id)
  })

  it('keeps a pick that is still offered, No ticket type included', () => {
    expect(paintChoiceOf(GA.id, [VIP, GA])).toBe(GA.id)
    expect(paintChoiceOf('', [VIP, GA])).toBe('')
  })

  it('goes back to the first ticket type when the picked one is gone', () => {
    expect(paintChoiceOf('tier-gone', [VIP, GA])).toBe(VIP.id)
  })

  it('is No ticket type when there is no type to paint with', () => {
    expect(paintChoiceOf(null, [])).toBe('')
  })
})

describe('seatAriaLabel — what a seat button says', () => {
  it('names the row, the seat and its ticket type', () => {
    expect(seatAriaLabel(6, 2, FREE.id, [FREE, NORMAL])).toBe('Row 7, seat 3: Free')
  })

  it('says when a seat has no ticket type', () => {
    expect(seatAriaLabel(0, 0, null, [FREE])).toBe('Row 1, seat 1: No ticket type')
    expect(seatAriaLabel(0, 0, 'tier-gone', [FREE])).toBe('Row 1, seat 1: No ticket type')
  })
})

describe('toReservedSeatingBody — what PUT /seating/reserved is sent', () => {
  const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
    ...toEventFormValues(null, [], []),
    seatingMode: 'reserved',
    venueName: 'BITEC',
    seatMapName: 'Hall A',
    seatRows: '2',
    seatsPerRow: '3',
    seatTicketTypes: [row(3, 'tier-vip'), ['tier-free', 'tier-ga', null]],
    ...over,
  })

  it('sends the grid and every seat’s ticket type', () => {
    expect(toReservedSeatingBody(values())).toEqual({
      name: 'Hall A',
      rows: 2,
      seatsPerRow: 3,
      seatTicketTypes: [row(3, 'tier-vip'), ['tier-free', 'tier-ga', null]],
    })
  })

  // The row shorthand would hide a split row; the whole map is always sent.
  it('never sends the row shorthand', () => {
    expect(toReservedSeatingBody(values())).not.toHaveProperty('rowTicketTypes')
  })

  it('names the map after the venue when it has no name of its own', () => {
    expect(toReservedSeatingBody(values({ seatMapName: ' ' })).name).toBe('BITEC')
    expect(toReservedSeatingBody(values({ seatMapName: '', venueName: '' })).name).toBe('Main hall')
  })

  it('sends one row of one seat for blank boxes, as the map shows', () => {
    const body = toReservedSeatingBody(values({ seatRows: '', seatsPerRow: '', seatTicketTypes: [[null]] }))
    expect(body.rows).toBe(1)
    expect(body.seatsPerRow).toBe(1)
    expect(body.seatTicketTypes).toEqual([[null]])
  })
})

/**
 * US-EVT-05: once a published event's seats have ticket types, the API refuses
 * a seat map with any seat left untyped. A seat added on Seating has none until
 * Assign seats, two steps on, so Seating must not be the one to send it.
 */
describe('seatingWaitsForSeatTypes — whether the seat map must wait for Assign seats', () => {
  const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
    ...toEventFormValues(null, [], []),
    status: 'upcoming',
    seatingMode: 'reserved',
    seatRows: '2',
    seatsPerRow: '3',
    seatTicketTypes: [row(3, 'tier-vip'), ['tier-free', 'tier-ga', 'tier-ga']],
    ...over,
  })

  it('waits on a published, typed map with a row added on Seating', () => {
    const grown = values({ seatRows: '3', seatTicketTypes: [row(3, 'tier-vip'), row(3, 'tier-ga'), row(3, null)] })
    expect(seatingWaitsForSeatTypes(grown)).toBe(true)
  })

  it('waits on a published, typed map whose rows were widened on Seating', () => {
    const widened = values({ seatsPerRow: '4', seatTicketTypes: [[...row(3, 'tier-vip'), null], row(4, 'tier-ga')] })
    expect(seatingWaitsForSeatTypes(widened)).toBe(true)
  })

  it('does not wait once every seat has a type, however the rows are split', () => {
    expect(seatingWaitsForSeatTypes(values())).toBe(false)
  })

  // A draft may leave seats open until it publishes.
  it('does not wait on a draft', () => {
    const draftMap = values({ status: 'draft', seatTicketTypes: [['tier-vip', null, null], row(3, null)] })
    expect(seatingWaitsForSeatTypes(draftMap)).toBe(false)
  })

  // Laid out before seats had types: it still sells as it always has.
  it('does not wait on a published map none of whose seats has a type', () => {
    expect(seatingWaitsForSeatTypes(values({ seatTicketTypes: [row(3, null), row(3, null)] }))).toBe(false)
  })

  it('does not wait for general admission or an online event', () => {
    const untyped = { seatTicketTypes: [['tier-vip', null, null]] }
    expect(seatingWaitsForSeatTypes(values({ ...untyped, seatingMode: 'ga' }))).toBe(false)
    expect(seatingWaitsForSeatTypes(values({ ...untyped, isOnline: true }))).toBe(false)
  })
})

/**
 * US-EVT-05: once a reserved event's seats have ticket types, each type's
 * quantity is the seats it holds. The API says so on every ticket of
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
 * US-EVT-05, US-EVT-06: the wizard's Tickets step has a Quantity column only
 * where the organizer sets the quantity. On an in-person reserved event each
 * type's is the seats it holds, given on Assign seats, so there is no
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

  it('is typed for an online event, which has no seat map', () => {
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

  // A new type has no seats in the saved map.
  it('is 0 for a type that has not been saved yet', () => {
    expect(storedQuantityOf(saved, null)).toBe('0')
    expect(storedQuantityOf([...saved, draft({ id: null, quantity: '999' })], null)).toBe('0')
  })
})
