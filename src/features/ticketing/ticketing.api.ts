import { api } from '@/lib/api'

/**
 * An event's ticket types. Owned by the ticketing feature; the event workspace
 * borrows the list for its Tickets tab.
 */

/** `TicketResponseDto` — the fields the workspace shows. */
export interface TicketWire {
  id: string
  eventId: string
  name: string
  isFree: boolean
  /** VAT-inclusive gross price, integer satang. */
  priceSatang: number
  currency: string
  status: string
  /** Sold so far (derived by the API, atomically). */
  sold: number
  /** Allocation. */
  total: number
  salesStartAt: string | null
  salesEndAt: string | null
  version: number
}

/** What the "Add ticket" slide-over sends. A free tier carries no price. */
export interface NewTicket {
  name: string
  isFree?: boolean
  priceSatang?: number
  total?: number
}

export const ticketingApi = {
  forEvent: (eventId: string) => api.get<TicketWire[]>(`/events/${eventId}/tickets`),

  add: (eventId: string, input: NewTicket) =>
    api.post<TicketWire>(`/events/${eventId}/tickets`, input),

  update: (eventId: string, ticketId: string, input: NewTicket & { version?: number }) =>
    api.patch<TicketWire>(`/events/${eventId}/tickets/${ticketId}`, input),

  /**
   * Remove a tier. The API answers `removed` when it never sold and `retired`
   * when it did — holders keep their tickets — and the difference has to reach
   * the organizer rather than being swallowed.
   */
  remove: (eventId: string, ticketId: string) =>
    api.delete<{ outcome: 'removed' | 'retired' }>(`/events/${eventId}/tickets/${ticketId}`),
}
