import { api, type Query } from '@/lib/api'
import type {
  CalendarWire,
  EventBucket,
  EventListItemWire,
  EventWire,
  EventSort,
  EventType,
  EventsSummaryWire,
  UpcomingEventWire,
} from './types'

/**
 * Every call the events feature makes, and nothing else — no formatting, no
 * view concerns. `GET /events` is paged and filtered server-side, so the page
 * hands its URL parameters straight through rather than fetching everything and
 * narrowing it locally.
 */

export interface ListEventsQuery extends Query {
  page?: number
  limit?: number
  q?: string
  type?: EventType
  bucket?: EventBucket
  sort?: EventSort
}

export const eventsApi = {
  list: (query: ListEventsQuery) => api.list<EventListItemWire>('/events', { query }),

  /** The Active/Completed badges — live counts for the whole workspace. */
  summary: () => api.get<EventsSummaryWire>('/events/summary'),

  /** Soonest first (US-EVT-12). */
  upcoming: (limit: number) => api.get<UpcomingEventWire[]>('/events/upcoming', { query: { limit } }),

  /** One Bangkok month, `YYYY-MM`; the API defaults to the current one. */
  calendar: (month?: string) => api.get<CalendarWire>('/events/calendar', { query: { month } }),

  /**
   * Delete a draft. `version` is the row the organizer was looking at: if it
   * has moved on since, the API rejects the delete rather than acting on a
   * stale view. A published event is refused — it must be cancelled instead,
   * and the API's own sentence explains that to the person.
   */
  remove: (id: string, version: number) => api.delete<void>(`/events/${id}`, { body: { version } }),

  /**
   * Copy an event into a fresh draft (US-EVT-01). The API decides what carries
   * over — tickets and agenda, not registrations — so there is nothing to pass.
   */
  duplicate: (id: string) => api.post<EventWire>(`/events/${id}/duplicate`),
}
