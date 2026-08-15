import { api } from '@/lib/api'
import type {
  ActiveEventWire,
  AnalyticsWire,
  HomeWire,
  Language,
  MeetingWire,
  RevenueRange,
  UpcomingEventWire,
} from './overview.types'

/** Everything the two overview screens read. Nothing here writes. */

/** How many events the activity ring names before the legend stops reading. */
export const RING_SIZE = 4

/** How many of today's meetings the home panel previews. */
export const MEETING_PREVIEW = 2

/** How many upcoming events fit the card row. */
export const UPCOMING_PREVIEW = 3

export const overviewApi = {
  /** Greeting, today's sign-ups and the alert feed, in one read. */
  home: (language: Language) => api.get<HomeWire>('/dashboard/home', { query: { language } }),

  upcoming: () => api.get<UpcomingEventWire[]>('/events/upcoming'),

  /** The busiest active events — the ring's slices, biggest share first. */
  activeEvents: () =>
    api.list<ActiveEventWire>('/events', {
      query: { bucket: 'active', sort: 'registrations', limit: RING_SIZE },
    }),

  todayMeetings: () =>
    api.list<MeetingWire>('/meetings', { query: { bucket: 'today', limit: MEETING_PREVIEW } }),

  /** The whole analytics dashboard — one read, one period, no disagreement. */
  analytics: (range: RevenueRange) => api.get<AnalyticsWire>('/dashboard', { query: { range } }),
}
