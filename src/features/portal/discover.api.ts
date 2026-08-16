import { api, type Query } from '@/lib/api'
import type { EventCardWire } from './discover.types'

/** Every call the What's on browser makes (US-DISC-01/02/03). */

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

  /** An attendee's shortlist, once there is an account to keep it in. */
  saved: () => api.list<EventCardWire>('/me/saved-events'),

  save: (eventId: string) => api.put<unknown>(`/me/saved-events/${eventId}`),

  unsave: (eventId: string) => api.delete<void>(`/me/saved-events/${eventId}`),
}
