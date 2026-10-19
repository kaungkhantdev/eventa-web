import { api } from '@/lib/api'

/**
 * The two parts of an event that belong to neither the event row nor its
 * tickets: the landing page's highlight list, and how the room is laid out.
 */

/** One highlight on the public page. */
export interface HighlightWire {
  text: string
  icon?: string | null
}

/** One row of a reserved map and the ticket type it sells (US-EVT-05). */
export interface SeatRowWire {
  /** `"1"`..`"N"` — the API numbers rows. */
  rowLabel: string
  ticketTypeId: string | null
  seats: number
}

/** `SeatingResponseDto` — the fields the wizard's Seating step reads. */
export interface SeatingWire {
  seatingMode: 'ga' | 'reserved'
  isOnline: boolean
  capacity: number | null
  seatMap: { name: string; rows: number; seatsPerRow: number; totalSeats: number } | null
  /** Every row of a reserved map, in row order; empty for general admission. */
  rows: SeatRowWire[]
  /** How many rows have no ticket type yet. */
  unassignedRows: number
  ticketQuantity: number
  seatShortfall: { totalSeats: number; ticketQuantity: number } | null
  note: string | null
}

/** `PUT /seating/reserved`. `rowTicketTypes` is one entry per row, index 0 = row 1. */
export interface ReservedSeatingBody {
  name: string
  rows: number
  seatsPerRow: number
  rowTicketTypes: (string | null)[]
}

export const eventContentApi = {
  highlights: (id: string) => api.get<HighlightWire[]>(`/events/${id}/highlights`),

  /** Replaces the whole ordered list — the API has no per-row endpoint. */
  setHighlights: (id: string, highlights: HighlightWire[]) =>
    api.put<HighlightWire[]>(`/events/${id}/highlights`, { highlights }),

  seating: (id: string) => api.get<SeatingWire>(`/events/${id}/seating`),

  /** General admission: a headcount, no seat map. */
  setGeneralSeating: (id: string, headcount: number) =>
    api.put<SeatingWire>(`/events/${id}/seating/general`, { headcount }),

  /** Reserved: a named grid, and the ticket type each row sells. `name` is required by the API. */
  setReservedSeating: (id: string, seatMap: ReservedSeatingBody) =>
    api.put<SeatingWire>(`/events/${id}/seating/reserved`, seatMap),
}
