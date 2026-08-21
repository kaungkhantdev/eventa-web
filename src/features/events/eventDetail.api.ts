import { api, type Query } from '@/lib/api'
import type { EventWire } from './types'

/**
 * The event workspace (US-EVT-14): one event, its headline numbers, and the
 * registrations and attendees behind them.
 *
 * The monitoring endpoints are separate from `events.api.ts` on purpose — they
 * answer "how is this event doing", are gated behind `regView` rather than
 * `evCreate`, and page independently of the event itself.
 */

/** `OverviewResponseDto`. */
export interface EventOverviewWire {
  registrations: number
  ticketsSold: number
  capacity: number | null
  fillPercent: number
  /** Integer satang, or null when the caller lacks `finView`. Never 0 for "hidden". */
  revenueSatang: number | null
  daysLeft: number
  publicUrl: string
}

/** `RegistrationRowDto` — note there is no email and no ticket-tier name here. */
export interface EventRegistrationWire {
  reference: string
  attendeeName: string
  tickets: number
  amountSatang: number
  paymentStatus: string
  registeredAt: string
}

export interface EventRegistrationsWire {
  items: EventRegistrationWire[]
  statusCounts: { all: number; paid: number; pending: number; refunded: number }
  page: number
  limit: number
  total: number
  totalPages: number
}

/** `AttendeeRowDto`. */
export interface EventAttendeeWire {
  name: string
  email: string
  registrations: number
  seats: number
}

export interface RegistrationsQuery extends Query {
  page?: number
  limit?: number
  /** The API's own filter values. */
  status?: 'paid' | 'pending' | 'refunded'
}

export const eventDetailApi = {
  event: (id: string) => api.get<EventWire>(`/events/${id}`),

  overview: (id: string) => api.get<EventOverviewWire>(`/events/${id}/overview`),

  registrations: (id: string, query: RegistrationsQuery) =>
    api.get<EventRegistrationsWire>(`/events/${id}/registrations`, { query }),

  attendees: (id: string, query: { page?: number; limit?: number }) =>
    api.list<EventAttendeeWire>(`/events/${id}/attendees`, { query }),
}
