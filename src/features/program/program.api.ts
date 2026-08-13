import { api } from '@/lib/api'

/**
 * The programme of an event: its sessions and its speakers.
 *
 * Owned by this feature even though the event workspace is what renders them
 * today — the agenda and speaker screens will read the same calls, and a second
 * copy of them living under `events/` is how the two start to disagree.
 */

/** `SessionResponseDto` — one agenda slot. */
export interface SessionWire {
  id: string
  eventId: string
  /** 1-based day index within the event. */
  day: number
  /** `09:00:00` — a wall-clock time, already the event's own. */
  startTime: string
  endTime: string | null
  title: string
  type: string
  room: string | null
  color: string
  description: string | null
  sortOrder: number
  speakers: { id: string; name: string }[]
}

/** `SpeakerResponseDto` — the fields the workspace shows. */
export interface SpeakerWire {
  id: string
  eventId: string
  name: string
  role: string | null
  /** The talk they are giving, when one has been recorded. */
  talkTitle: string | null
  /** "Keynote", "Track A" — the organizer's own label. */
  tag: string | null
  bio: string | null
  photoUrl: string | null
  /** How many sessions they appear in. */
  sessionCount: number
}

/** What the "Add session" slide-over sends. */
export interface NewSession {
  day: number
  startTime: string
  endTime?: string
  title: string
  type: string
  room?: string
  speakerIds?: string[]
}

export const programApi = {
  sessions: (eventId: string) => api.get<SessionWire[]>(`/events/${eventId}/sessions`),

  addSession: (eventId: string, input: NewSession) =>
    api.post<SessionWire>(`/events/${eventId}/sessions`, input),

  /** `confirm` is required by the API — a delete without it is refused. */
  removeSession: (eventId: string, sessionId: string) =>
    api.delete<void>(`/events/${eventId}/sessions/${sessionId}`, { query: { confirm: true } }),

  speakers: (eventId: string, limit: number) =>
    api.list<SpeakerWire>(`/events/${eventId}/speakers`, { query: { limit } }),
}
