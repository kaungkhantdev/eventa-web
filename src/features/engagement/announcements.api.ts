import { api, type Query } from '@/lib/api'
import type { AnnouncementWire } from './announcements.types'

/** Everything the announcements page asks of eventa-api (US-MSG-04/05). */

export interface SendAnnouncementInput {
  subject: string
  message: string
  /** A UTC instant to send it at; absent sends it now. */
  sendAt?: string
}

export const announcementsApi = {
  list: (query: Query) => api.list<AnnouncementWire>('/announcements', { query }),

  /**
   * Now or later, the send lives on the event Monitor (US-EVT-14) — a
   * broadcast is something you do to an event's attendees, and there is no
   * second endpoint for it. `confirm` is the API's explicit "yes, send".
   */
  send: (eventId: string, input: SendAnnouncementInput) =>
    api.post(`/events/${eventId}/attendees/email`, { ...input, confirm: true }),

  cancel: (id: string) => api.post<AnnouncementWire>(`/announcements/${id}/cancel`),

  reschedule: (id: string, sendAt: string) =>
    api.patch<AnnouncementWire>(`/announcements/${id}`, { sendAt }),
}
