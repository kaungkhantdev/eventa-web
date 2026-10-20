import { api } from '@/lib/api'

/**
 * The workspace's Google Calendar connection (US-MTG-08), as eventa-api's
 * `CalendarConnectionDto` describes it.
 *
 * `not_configured` is the server's answer, not the row's: it means this
 * deployment has no Google client at all, whatever was once connected.
 */
export type CalendarConnectionStatus = 'not_configured' | 'disconnected' | 'connected' | 'expired'

export interface CalendarConnectionWire {
  provider: 'google'
  status: CalendarConnectionStatus
  /**
   * The Google account that granted access. Null unless connected or expired,
   * and null for a caller without `setIntegrations` — the API leaves it out
   * for anyone who cannot change it (NFR-PDPA-04).
   */
  accountEmail: string | null
  /** ISO instant. Null unless connected or expired. */
  connectedAt: string | null
}

/** Where `POST /calendar-connection/connect` sends the browser next. */
export interface CalendarConnectStartWire {
  authorizeUrl: string
}

export const calendarConnectionApi = {
  get: () => api.get<CalendarConnectionWire>('/calendar-connection'),
  /**
   * Starts the Google consent flow. Nothing is connected yet: the API answers
   * with the consent page's address and finishes the job on Google's redirect.
   */
  connect: () => api.post<CalendarConnectStartWire>('/calendar-connection/connect'),
  disconnect: () => api.post<CalendarConnectionWire>('/calendar-connection/disconnect'),
}
