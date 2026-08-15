/** What the agenda and speakers screens read off the wire, and what they render. */

export type SpeakerTone = 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'pink'

export type SessionType = 'Keynote' | 'Talk' | 'Workshop' | 'Panel' | 'Break'

export type SessionColor = 'green' | 'amber' | 'rose' | 'blue' | 'slate'

export interface SpeakerWire {
  id: string
  eventId: string
  name: string
  /** Null until the organizer records one — the same for the four below. */
  role: string | null
  email: string | null
  phone: string | null
  talkTitle: string | null
  tag: string | null
  /**
   * Null until somebody supplies them — a speaker added through the form has
   * no initials, tone or rating, whatever `openapi.json` marks as required.
   */
  initials: string | null
  tone: SpeakerTone | null
  /** Average feedback rating; null until anybody has rated them. */
  rating: string | null
  /** Live sessions this speaker is booked into (US-PROG-06). */
  sessionCount: number
  bio: string | null
  photoUrl: string | null
  website: string | null
  version: number
}

export interface SessionSpeakerWire {
  id: string
  name: string
}

export interface SessionWire {
  id: string
  eventId: string
  /** 1-based index into the event's days. */
  day: number
  /** `HH:MM:SS` wall clock — a time of day, with no zone of its own. */
  startTime: string
  endTime: string
  title: string
  type: SessionType
  room: string
  /** Derived from `type` by the API; the same type is always the same colour. */
  color: SessionColor
  description: string
  sortOrder: number
  speakers: SessionSpeakerWire[]
  version: number
}

export interface SpeakerCard {
  id: string
  name: string
  /** Null until the organizer records one — the same for the four below. */
  role: string | null
  email: string | null
  phone: string | null
  initials: string
  /** Tailwind classes for the avatar, chosen from the API's tone. */
  avatar: string
  sessionCount: number
  /** `4.9`, or `—` when nobody has rated them yet. */
  rating: string
}

export interface AgendaBlock {
  id: string
  /** Which day column it belongs in, 1-based, as the API schedules it. */
  day: number
  title: string
  type: SessionType
  /** `09:00 – 10:00`, on the event's own wall clock. */
  time: string
  /** Who is presenting, or the room when nobody is booked. */
  who: string
  color: SessionColor
  /** Where the block sits in the calendar column, in pixels from the top. */
  top: number
  height: number
  /** Everything the edit form needs, so a click can open it filled in. */
  edit: SessionDraft
}

/** A session as the form holds it, before it goes back over the wire. */
export interface SessionDraft {
  id: string
  day: number
  /** `09:30` — the form's `<input type="time">` value. */
  startTime: string
  endTime: string
  title: string
  type: SessionType
  room: string
  description: string
  speakerIds: string[]
  version: number
}

/** One column of the week strip. */
export interface AgendaDay {
  /** The 1-based index the API schedules against. */
  index: number
  /** `Mon`. */
  weekday: string
  /** `12`. */
  dayOfMonth: string
  /** Whether this is the day the event starts. */
  isFirst: boolean
}
