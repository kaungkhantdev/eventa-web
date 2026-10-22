import { api } from '@/lib/api'
import type {
  ActiveEventWire,
  AnalyticsWire,
  HomeWire,
  Language,
  MeetingWire,
  SetupWire,
  RevenueRange,
  UpcomingEventWire,
} from './overview.types'
import { MEETING_PREVIEW, RING_SIZE } from '@/lib/constants/overview.constants'

/** Everything the two overview screens read. Nothing here writes. */

export const overviewApi = {
  /** Greeting, today's sign-ups and the alert feed, in one read. */
  home: (language: Language) => api.get<HomeWire>('/dashboard/home', { query: { language } }),

  /** How far this workspace has been set up — the first-run checklist. */
  setup: () => api.get<SetupWire>('/dashboard/setup'),

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
