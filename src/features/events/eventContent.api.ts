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

/** `SeatingResponseDto` — the fields the wizard's Seating step reads. */
export interface SeatingWire {
  seatingMode: 'ga' | 'reserved'
  isOnline: boolean
  capacity: number | null
  seatMap: { name: string; rows: number; seatsPerRow: number; totalSeats: number } | null
  ticketQuantity: number
  seatShortfall: { totalSeats: number; ticketQuantity: number } | null
  note: string | null
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

  /** Reserved: a named grid. `name` is required by the API. */
  setReservedSeating: (id: string, seatMap: { name: string; rows: number; seatsPerRow: number }) =>
    api.put<SeatingWire>(`/events/${id}/seating/reserved`, seatMap),
}
