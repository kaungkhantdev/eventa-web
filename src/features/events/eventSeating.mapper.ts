import { seatCountLabel, seatKeyLabelOf, seatsOfType, type SeatRowTypes } from '@/lib/seatPlaces'
import { swatchOf } from '@/lib/seatSwatches'
import type { ReservedSeatingBody, SeatRowWire } from './eventContent.api'
import {
  quantitySetBySeats,
  seatRowsApply,
  type EventFormValues,
  type QuantityFacts,
  type TicketDraft,
} from './eventForm.mapper'
import { DEFAULT_MAP_NAME, MIXED_ROW, NO_TICKET_TYPE, NO_TYPE_VALUE, SEATS_PER_ROW_MAX, SEAT_ROWS_MAX } from '@/lib/constants/events.constants'

/**
 * The wizard's rules for a reserved map split between ticket types seat by
 * seat (US-EVT-05): the grid is laid out on the Seating step, and on Assign
 * seats each row's dropdown gives the whole row a type while the paint picker
 * and the map give just the seats clicked or dragged across one. Each type's
 * quantity is the seats it holds — so the Tickets step asks for none.
 *
 * The types are held as a matrix, `[row][seat]` with index 0 = row 1 and seat
 * 1, because that is the shape `PUT /seating/reserved` takes as
 * `seatTicketTypes`. `null` is a seat with no type yet.
 */

/** Each seat's ticket type, `[row][seat]`; `null` for a seat with none. */
export type SeatTicketTypes = (string | null)[][]

/** A ticket type a seat can be given. */
export interface TicketTypeChoice {
  id: string
  name: string
}

/** One entry in the map's key. `swatch` is null for the neutral, untyped seat. */
export interface SeatLegendEntry {
  ticketTypeId: string | null
  label: string
  swatch: number | null
}

/** One choice in the paint picker: a type's id, or `''` for "No ticket type". */
export interface PaintOption {
  value: string
  label: string
  swatch: number | null
}

/** GET /seating's rows → each seat's type at its row and seat number. */
export function seatTicketTypesOf(
  rows: readonly SeatRowWire[],
  rowCount: number,
  seatsPerRow: number,
): SeatTicketTypes {
  const byRow = new Map(rows.map((row) => [Number(row.rowLabel) - 1, row.seatTicketTypes]))
  return Array.from({ length: rowCount }, (_, row) => seatsOf(byRow.get(row) ?? [], seatsPerRow))
}

/**
 * How many rows the save sends — the same `|| 1` the save itself applies to a
 * blank box — so the map always has one entry per row the API will get.
 */
export function seatRowCount(typed: string): number {
  return boxCount(typed, SEAT_ROWS_MAX)
}

/** How many seats each row the save sends has, by the same rule. */
export function seatsPerRowCount(typed: string): number {
  return boxCount(typed, SEATS_PER_ROW_MAX)
}

/** Only ticket types the API has stored: a seat can only point at one of those. */
export function ticketTypeChoices(tickets: readonly TicketDraft[]): TicketTypeChoice[] {
  return tickets.flatMap((ticket) => (ticket.id === null ? [] : [{ id: ticket.id, name: ticket.name }]))
}

/** A row dropdown's or the paint picker's value → a type, or none for "No ticket type". */
export function typeOfChoice(value: string): string | null {
  return value === NO_TYPE_VALUE ? null : value
}

/**
 * One seat given a type. The map may be larger than the grid — seats kept from
 * before the organizer shrank it — or smaller, so a seat past the end is
 * filled up to. A seat that already has the type hands back the same map, so
 * a drag over seats already painted changes nothing.
 */
export function withSeatType(
  types: SeatTicketTypes,
  row: number,
  seat: number,
  ticketTypeId: string | null,
): SeatTicketTypes {
  const seats = types[row]
  if (seats !== undefined && seat < seats.length && seats[seat] === ticketTypeId) return types
  const next = rowsUpTo(types, row)
  const painted = next[row]!
  while (painted.length <= seat) painted.push(null)
  painted[seat] = ticketTypeId
  return next
}

/** A row's dropdown: every seat of the row given one type, or none. */
export function withRowType(
  types: readonly (readonly (string | null)[])[],
  row: number,
  seatsPerRow: number,
  ticketTypeId: string | null,
): SeatTicketTypes {
  const next = rowsUpTo(types, row)
  next[row] = Array.from({ length: seatsPerRow }, () => ticketTypeId)
  return next
}

/**
 * What the map shows and the save sends: exactly one entry per seat of every
 * row, each surviving seat keeping its type and a new one starting with none,
 * and no seat pointing at a type that is not among the event's own — the API
 * would refuse that save.
 */
export function seatTicketTypesFor(
  types: readonly (readonly (string | null)[])[],
  rowCount: number,
  seatsPerRow: number,
  choices: readonly TicketTypeChoice[],
): SeatTicketTypes {
  const known = new Set(choices.map((choice) => choice.id))
  return Array.from({ length: rowCount }, (_, row) =>
    seatsOf(types[row] ?? [], seatsPerRow).map((type) => (type !== null && known.has(type) ? type : null)),
  )
}

/** A row dropdown's value: the type all its seats share, none, or `MIXED_ROW` when they differ. */
export function rowChoiceOf(seats: readonly (string | null)[]): string {
  const first = seats[0] ?? null
  if (seats.some((seat) => seat !== first)) return MIXED_ROW
  return first ?? NO_TYPE_VALUE
}

/**
 * Each seat's colour, by the shared rule (`swatchOf`) the public page colours
 * by too (US-PAGE-05): its type's place among the choices — the event's saved
 * types, listed in the order they were created — or null for none.
 */
export function seatSwatchesOf(
  types: readonly (readonly (string | null)[])[],
  choices: readonly TicketTypeChoice[],
): (number | null)[][] {
  const byCreation = idsOf(choices)
  return types.map((seats) => seats.map((type) => swatchOf(type, byCreation)))
}

/**
 * The map's key: every ticket type, in ticket order, with where its seats are
 * and how many (`seatKeyLabelOf`, the public page's rule too) — a type with
 * none is listed as well, since publishing needs every type to have a seat —
 * then the seats still without a type, when there are any.
 */
export function seatLegend(
  types: readonly (readonly (string | null)[])[],
  choices: readonly TicketTypeChoice[],
): SeatLegendEntry[] {
  const map = seatMapOf(types)
  const byCreation = idsOf(choices)
  const legend = choices.map((choice) => ({
    ticketTypeId: choice.id,
    label: seatKeyLabelOf(choice.name, map, choice.id),
    swatch: swatchOf(choice.id, byCreation),
  }))
  const untyped = seatsOfType(map, null)
  if (untyped === 0) return legend
  return [...legend, { ticketTypeId: null, label: `${NO_TICKET_TYPE} · ${seatCountLabel(untyped)}`, swatch: null }]
}

/** The paint picker's choices: every saved type in its colour, then "No ticket type". */
export function paintOptionsOf(choices: readonly TicketTypeChoice[]): PaintOption[] {
  const byCreation = idsOf(choices)
  return [
    ...choices.map((choice) => ({ value: choice.id, label: choice.name, swatch: swatchOf(choice.id, byCreation) })),
    { value: NO_TYPE_VALUE, label: NO_TICKET_TYPE, swatch: null },
  ]
}

/**
 * What the paint picker has picked: the organizer's pick while it is still
 * offered, else the first ticket type — "No ticket type" when there is none.
 * `picked` is null until the organizer picks.
 */
export function paintChoiceOf(picked: string | null, choices: readonly TicketTypeChoice[]): string {
  const offered = picked === NO_TYPE_VALUE || choices.some((choice) => choice.id === picked)
  if (picked !== null && offered) return picked
  return choices[0]?.id ?? NO_TYPE_VALUE
}

/** A seat button's name for a screen reader: `Row 7, seat 3: Free`. Both indexes are 0-based. */
export function seatAriaLabel(
  row: number,
  seat: number,
  ticketTypeId: string | null,
  choices: readonly TicketTypeChoice[],
): string {
  const type = choices.find((choice) => choice.id === ticketTypeId)?.name ?? NO_TICKET_TYPE
  return `Row ${row + 1}, seat ${seat + 1}: ${type}`
}

/**
 * The room as `PUT /seating/reserved` takes it. `seatTicketTypes` is always
 * sent: the wizard holds every seat's type, and leaving it out would tell the
 * API to keep whatever the seats had.
 */
export function toReservedSeatingBody(values: EventFormValues): ReservedSeatingBody {
  return {
    name: values.seatMapName.trim() || values.venueName.trim() || DEFAULT_MAP_NAME,
    rows: Number(values.seatRows) || 1,
    seatsPerRow: Number(values.seatsPerRow) || 1,
    seatTicketTypes: values.seatTicketTypes,
  }
}

/** What decides whether the seat map can be saved with its seats as they are. */
export type SeatMapState = Pick<EventFormValues, 'status' | 'seatingMode' | 'isOnline' | 'seatTicketTypes'>

/**
 * Whether the seat map must wait for Assign seats before it is saved. Once a
 * published event's map has typed seats, the API refuses a map with any seat
 * left untyped — and a seat added on Seating, by a new row or a wider one, has
 * no type until Assign seats, which comes after Tickets and sends the whole
 * grid. A draft may leave seats open, and a map none of whose seats has a type
 * sells as it always has.
 */
export function seatingWaitsForSeatTypes(event: SeatMapState): boolean {
  if (event.status === null || event.status === 'draft' || !seatRowsApply(event)) return false
  const seats = event.seatTicketTypes.flat()
  return seats.some((type) => type !== null) && seats.includes(null)
}

/**
 * Whether the seat map sets this event's ticket quantities. The API marks
 * every ticket of such an event, so any one of them answers for the event.
 */
export function quantityFromSeatsOf(tickets: readonly { quantityFromSeats: boolean }[]): boolean {
  return tickets.some((ticket) => ticket.quantityFromSeats)
}

/**
 * How the wizard's Tickets step shows each type's quantity (US-EVT-05,
 * US-EVT-06): no column at all, a box the organizer types in, or the API's
 * stored number read-only.
 */
export type QuantityColumn = 'none' | 'typed' | 'readOnly'

/**
 * Whether the Tickets step has a Quantity column, and whether it is typed. An
 * in-person reserved event has none: each type's quantity is the seats it
 * holds, given on Assign seats, and a note under the list says so. Anywhere else
 * the organizer types it — unless the API still sets it from a seat map the
 * form has switched away from but not saved, which the save leaves in charge
 * (`toTicketBody` drops a typed number), so its stored number shows read-only.
 */
export function quantityColumnOf(event: QuantityFacts): QuantityColumn {
  if (seatRowsApply(event)) return 'none'
  return quantitySetBySeats(event) ? 'readOnly' : 'typed'
}

/** The quantity the API stored for a ticket type; 0 for one not saved yet, which has no seats. */
export function storedQuantityOf(tickets: readonly TicketDraft[], ticketId: string | null): string {
  return tickets.find((ticket) => ticket.id !== null && ticket.id === ticketId)?.quantity ?? '0'
}

function idsOf(choices: readonly TicketTypeChoice[]): string[] {
  return choices.map((choice) => choice.id)
}

/** A typed box → a count from 1 to `max`; blank or not a number is 1. */
function boxCount(typed: string, max: number): number {
  const count = Math.trunc(Number(typed)) || 1
  return Math.min(Math.max(count, 1), max)
}

/** A row's seats, exactly `seatsPerRow` of them: seats past the end have no type. */
function seatsOf(seats: readonly (string | null)[], seatsPerRow: number): (string | null)[] {
  return Array.from({ length: seatsPerRow }, (_, seat) => seats[seat] ?? null)
}

/** A copy of the map, every row copied too, with rows up to `row` — the new ones empty. */
function rowsUpTo(types: readonly (readonly (string | null)[])[], row: number): SeatTicketTypes {
  const next = types.map((seats) => [...seats])
  while (next.length <= row) next.push([])
  return next
}

/** The matrix as the shared seat-places rule reads it, rows numbered 1..N. */
function seatMapOf(types: readonly (readonly (string | null)[])[]): SeatRowTypes[] {
  return types.map((seats, row) => ({ label: String(row + 1), seats }))
}
