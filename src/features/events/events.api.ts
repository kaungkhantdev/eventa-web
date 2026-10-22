import { api, type Query } from '@/lib/api'
import type { IssuedUpload } from '@/lib/signedUpload'
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

/** What `PATCH /events/:id/page` changes (US-PAGE-10); absent keys are left alone. */
export interface PageSettingsBody {
  slug?: string
  accentColor?: string
}

/** What `PATCH /events/:id/page` answers with. */
export interface PageSettingsWire {
  slug: string
  template: string
  accentColor: string
  published: boolean
}

/** What `POST /events` accepts — and it rejects anything else. */
export interface CreateEventBody {
  name: string
  type: EventType
  startAt: string | null
  description?: string
}

export const eventsApi = {
  get: (id: string) => api.get<EventWire>(`/events/${id}`),

  /**
   * Create the draft. Only these fields; everything else on the wizard is a
   * PATCH against the id this returns.
   */
  create: (body: CreateEventBody) => api.post<EventWire>('/events', body),

  /** Every response carries the row already bumped, so the caller re-reads `version`. */
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<EventWire>(`/events/${id}`, body),

  /**
   * Take the draft live. Refused with 422 unless the event has a title, a
   * description, a place and a ticket type — the wizard checks the same rules
   * first so nobody clicks a button that cannot work, but the API decides.
   */
  publish: (id: string, body: { visibility?: string; landingTemplateId?: string; confirmPastStart?: boolean; version?: number }) =>
    api.post<EventWire>(`/events/${id}/publish`, body),

  /**
   * The page's public address and accent colour. An address already in use is
   * refused with a 409 asking for another; a colour that is not one is stored
   * as the brand default.
   */
  updatePage: (id: string, body: PageSettingsBody) =>
    api.patch<PageSettingsWire>(`/events/${id}/page`, body),

  unpublish: (id: string, version?: number) =>
    api.post<EventWire>(`/events/${id}/unpublish`, { version }),

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
   * Cancel an event that can no longer be deleted (US-EVT-08). The reason is
   * required and is what attendees are told; `version` is the row on screen,
   * so a stale view is refused rather than acted on.
   */
  cancel: (id: string, body: { reason: string; version?: number }) =>
    api.post<EventWire>(`/events/${id}/cancel`, body),

  /**
   * Copy an event into a fresh draft (US-EVT-01). The API decides what carries
   * over — tickets and agenda, not registrations — so there is nothing to pass.
   */
  duplicate: (id: string) => api.post<EventWire>(`/events/${id}/duplicate`),

  /**
   * Two steps, because the bytes never pass through the API: ask for a
   * capability, PUT the file straight to storage, then confirm to have it
   * promoted and get the URL back.
   *
   * Not scoped to an event id: the wizard offers the cover on step 1, before a
   * draft exists. The confirmed URL is a field value the event carries when the
   * form is saved.
   */
  coverUploadUrl: (contentType: string, byteSize: number) =>
    api.post<IssuedUpload>('/events/cover/upload-url', { contentType, byteSize }),

  confirmCover: (key: string) =>
    api.post<{ coverImage: string }>('/events/cover', { key }),
}
