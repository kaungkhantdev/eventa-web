import { api, type Query } from '@/lib/api'
import type { EventCardWire } from './discover.types'

/** Every call the What's on browser makes (US-DISC-01/02/03). */

/** The most `GET /me/saved-events` sends in one page. */
const SAVED_PAGE_LIMIT = 48

export interface DiscoverQuery extends Query {
  page: number
  limit: number
  q?: string
  category?: string
}

export const discoverApi = {
  /** The public feed. No session — browsing never requires an account. */
  list: (query: DiscoverQuery) => api.list<EventCardWire>('/public/discover', { query }),

  categories: () => api.get<string[]>('/public/discover/categories'),

  /**
   * One page of an attendee's shortlist, once there is an account to keep it
   * in — as large a page as the API allows, because the shortlist is read
   * whole (see `discover.routes.ts`).
   */
  saved: (page: number) =>
    api.list<EventCardWire>('/me/saved-events', { query: { page, limit: SAVED_PAGE_LIMIT } }),

  save: (eventId: string) => api.put<unknown>(`/me/saved-events/${eventId}`),

  unsave: (eventId: string) => api.delete<void>(`/me/saved-events/${eventId}`),

  /** Adopt the saves a guest made before signing in; ids already saved are skipped. */
  merge: (eventIds: string[]) =>
    api.post<{ merged: number }>('/me/saved-events/merge', { eventIds }),
}
