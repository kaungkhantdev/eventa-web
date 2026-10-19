import { num } from '@/lib/format'
import type { ReservedSeatingBody, SeatRowWire } from './eventContent.api'
import { quantitySetBySeats, seatRowsApply, type EventFormValues, type TicketDraft } from './eventForm.mapper'

/**
 * The wizard's rules for a reserved map split between ticket types by whole
 * rows (US-EVT-05): the grid is laid out on the Seating step, each row is given
 * a type on Assign seats, and the Tickets step shows each type's quantity as
 * the seats its rows hold.
 *
 * A row's type is held as one list, one entry per row with index 0 = row 1,
 * because that is the shape `PUT /seating/reserved` takes as `rowTicketTypes`.
 * `null` is a row with no type yet.
 */

/** Each row's ticket type, index 0 = row 1; `null` for a row with none. */
export type RowTicketTypes = (string | null)[]

/** A ticket type a row can be given. */
export interface TicketTypeChoice {
  id: string
  name: string
}

/** One entry in the preview's key. `swatch` is null for the neutral, untyped seat. */
export interface SeatLegendEntry {
  ticketTypeId: string | null
  label: string
  swatch: number | null
}

/** `ConfigureReservedDto`'s own ceiling: past it the API refuses the map. */
const SEAT_ROWS_MAX = 100
const NO_TICKET_TYPE = 'No ticket type'
/** The API requires a map name; the venue is the sensible default, then this. */
const DEFAULT_MAP_NAME = 'Main hall'

/** GET /seating's rows → each row's type at its row number. */
export function rowTicketTypesOf(rows: readonly SeatRowWire[], rowCount: number): RowTicketTypes {
  const types: RowTicketTypes = Array.from({ length: rowCount }, () => null)
  for (const row of rows) {
    const index = Number(row.rowLabel) - 1
    if (Number.isInteger(index) && index >= 0 && index < rowCount) types[index] = row.ticketTypeId
  }
  return types
}

/**
 * How many rows the save sends — the same `|| 1` the save itself applies to a
 * blank box — so the list always has one entry per row the API will get.
 */
export function seatRowCount(typed: string): number {
  const rows = Math.trunc(Number(typed)) || 1
  return Math.min(Math.max(rows, 1), SEAT_ROWS_MAX)
}

/** Only ticket types the API has stored: a row can only point at one of those. */
export function ticketTypeChoices(tickets: readonly TicketDraft[]): TicketTypeChoice[] {
  return tickets.flatMap((ticket) => (ticket.id === null ? [] : [{ id: ticket.id, name: ticket.name }]))
}

/** The row select's value → a type, or none for its "No ticket type" option. */
export function rowTypeOf(value: string): string | null {
  return value === '' ? null : value
}

/**
 * One row given a type. The list may be longer than the map — rows kept from
 * before the organizer shortened it — so a row past the end is filled up to.
 */
export function withRowType(types: readonly (string | null)[], row: number, ticketTypeId: string | null): RowTicketTypes {
  const next: RowTicketTypes = [...types]
  while (next.length <= row) next.push(null)
  next[row] = ticketTypeId
  return next
}

/**
 * What the list shows and the save sends: exactly one entry per row, and no
 * row pointing at a type that is not among the event's own — the API would
 * refuse that save.
 */
export function rowTicketTypesFor(
  types: readonly (string | null)[],
  rowCount: number,
  choices: readonly TicketTypeChoice[],
): RowTicketTypes {
  const known = new Set(choices.map((choice) => choice.id))
  return Array.from({ length: rowCount }, (_, row) => {
    const type = types[row] ?? null
    return type !== null && known.has(type) ? type : null
  })
}

/** Each row's colour: its type's place among the choices, or null for none. */
export function rowSwatchesOf(types: readonly (string | null)[], choices: readonly TicketTypeChoice[]): (number | null)[] {
  return types.map((type) => {
    const index = choices.findIndex((choice) => choice.id === type)
    return index === -1 ? null : index
  })
}

/** The seats in the rows given this ticket type — or, for null, in the rows with none. */
export function seatsOfType(
  types: readonly (string | null)[],
  ticketTypeId: string | null,
  seatsPerRow: number,
): number {
  return types.filter((type) => type === ticketTypeId).length * seatsPerRow
}

/**
 * The preview's key: every ticket type with the seats its rows hold — a type
 * with none is listed too, since publishing needs every type to have a row —
 * then the rows still without a type, when there are any.
 */
export function seatLegend(
  types: readonly (string | null)[],
  choices: readonly TicketTypeChoice[],
  seatsPerRow: number,
): SeatLegendEntry[] {
  const legend = choices.map((choice, swatch) => ({
    ticketTypeId: choice.id,
    label: `${choice.name} · ${seatsLabel(seatsOfType(types, choice.id, seatsPerRow))}`,
    swatch,
  }))
  const untyped = seatsOfType(types, null, seatsPerRow)
  if (untyped === 0) return legend
  return [...legend, { ticketTypeId: null, label: `${NO_TICKET_TYPE} · ${seatsLabel(untyped)}`, swatch: null }]
}

/**
 * The room as `PUT /seating/reserved` takes it. `rowTicketTypes` is always
 * sent: the wizard holds every row's type, and leaving it out would tell the
 * API to keep whatever the rows had.
 */
export function toReservedSeatingBody(values: EventFormValues): ReservedSeatingBody {
  return {
    name: values.seatMapName.trim() || values.venueName.trim() || DEFAULT_MAP_NAME,
    rows: Number(values.seatRows) || 1,
    seatsPerRow: Number(values.seatsPerRow) || 1,
    rowTicketTypes: values.rowTicketTypes,
  }
}

/** What decides whether the seat map can be saved with its rows as they are. */
export type SeatMapState = Pick<EventFormValues, 'status' | 'seatingMode' | 'isOnline' | 'rowTicketTypes'>

/**
 * Whether the seat map must wait for Assign seats before it is saved. Once a
 * published event's rows have ticket types, the API refuses a map with any row
 * left untyped (its `assertEveryRowTyped`) — and a row added on Seating has no
 * type until Assign seats, which comes after Tickets and sends the whole grid.
 * A draft may leave rows open, and a map none of whose rows has a type sells
 * as it always has.
 */
export function seatingWaitsForRowTypes(event: SeatMapState): boolean {
  if (event.status === null || event.status === 'draft' || !seatRowsApply(event)) return false
  const types = event.rowTicketTypes
  return types.some((type) => type !== null) && types.includes(null)
}

/**
 * Whether the seat map sets this event's ticket quantities. The API marks
 * every ticket of such an event, so any one of them answers for the event.
 */
export function quantityFromSeatsOf(tickets: readonly { quantityFromSeats: boolean }[]): boolean {
  return tickets.some((ticket) => ticket.quantityFromSeats)
}

/**
 * The quantity a ticket row shows read-only, or null when it is typed. `now` is
 * the wizard as it stands; `saved` is what the API last returned.
 *
 * On an in-person reserved event it is the seats the type's rows hold, worked
 * out from the rows as they are picked right now, so it moves the moment a row
 * changes hands. A type not saved yet has no rows, so it is 0 — never the rows
 * still without a type. Anywhere else the seat map sets it only while the API
 * still says so, and then it is the number the API stored.
 */
export function seatQuantityOf(
  now: EventFormValues,
  saved: EventFormValues,
  ticketId: string | null,
): string | null {
  if (!quantitySetBySeats({ ...now, quantityFromSeats: saved.quantityFromSeats })) return null
  if (!seatRowsApply(now)) return storedQuantityOf(saved.tickets, ticketId)
  if (ticketId === null) return '0'
  return String(seatsOfType(now.rowTicketTypes, ticketId, Number(now.seatsPerRow) || 0))
}

function storedQuantityOf(tickets: readonly TicketDraft[], ticketId: string | null): string {
  return tickets.find((ticket) => ticket.id !== null && ticket.id === ticketId)?.quantity ?? '0'
}

function seatsLabel(seats: number): string {
  return `${num(seats)} ${seats === 1 ? 'seat' : 'seats'}`
}
