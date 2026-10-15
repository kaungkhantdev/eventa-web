import { api, type Query } from '@/lib/api'
import type { SessionType, SessionWire, SpeakerTone, SpeakerWire } from './program.types'

/* The wire shapes live in `program.types`; re-exported here because the event
   workspace reads the same programme through this module. */
export type { SessionWire, SpeakerWire } from './program.types'

/**
 * The agenda and the speaker directory (US-PROG-01..07).
 *
 * Both are scoped to one event on the API — a session belongs to a day of a
 * particular event, and a speaker is booked for one — so every call names it.
 */

export interface SpeakerQuery extends Query {
  page?: number
  limit?: number
  search?: string
}

export interface SpeakerInput {
  name: string
  role?: string
  email?: string
  phone?: string
  talkTitle?: string
  tone?: SpeakerTone
  bio?: string
  version?: number
}

export interface SessionInput {
  day: number
  /** 24h `HH:MM`. */
  startTime: string
  endTime?: string
  title: string
  type: SessionType
  room?: string
  description?: string
  speakerIds?: string[]
  /**
   * Re-sent as true after a clash refusal, to book a speaker who is already
   * scheduled at that hour — the organizer's call, made explicitly.
   */
  confirmSpeakerClash?: boolean
  version?: number
}

export const programApi = {
  sessions: (eventId: string) => api.get<SessionWire[]>(`/events/${eventId}/sessions`),

  createSession: (eventId: string, input: SessionInput) =>
    api.post<SessionWire>(`/events/${eventId}/sessions`, input),

  updateSession: (eventId: string, id: string, input: SessionInput) =>
    api.patch<SessionWire>(`/events/${eventId}/sessions/${id}`, input),

  /**
   * `confirm` says the organizer accepted the warning that attendees who
   * bookmarked the session are not told; the API refuses the removal without it.
   */
  removeSession: (eventId: string, id: string, confirmed: boolean) =>
    api.delete<void>(`/events/${eventId}/sessions/${id}`, { query: confirmation(confirmed) }),

  speakers: (eventId: string, query: SpeakerQuery = {}) =>
    api.list<SpeakerWire>(`/events/${eventId}/speakers`, { query }),

  createSpeaker: (eventId: string, input: SpeakerInput) =>
    api.post<SpeakerWire>(`/events/${eventId}/speakers`, input),

  updateSpeaker: (eventId: string, id: string, input: SpeakerInput) =>
    api.patch<SpeakerWire>(`/events/${eventId}/speakers/${id}`, input),

  /**
   * `confirm` says the organizer accepted the warning that the speaker comes
   * off every session; the API refuses the removal without it.
   */
  removeSpeaker: (eventId: string, id: string, confirmed: boolean) =>
    api.delete<void>(`/events/${eventId}/speakers/${id}`, { query: confirmation(confirmed) }),
}

/** `?confirm=true` when the organizer confirmed, and nothing claimed otherwise. */
function confirmation(confirmed: boolean): Query {
  return confirmed ? { confirm: true } : {}
}
