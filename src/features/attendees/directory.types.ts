/** The attendee directory (US-CHK-06/07): everyone who ever registered. */

export type AttendeeTag = 'VIP' | 'Speaker' | 'Sponsor' | 'Student'

export type AttendeeSegment = 'all' | 'new' | 'checked_in' | 'vip'

export type AttendeeSort = 'recent' | 'name' | 'events' | 'tickets'

export interface AttendeeWire {
  id: number
  name: string
  email: string
  phone: string | null
  company: string | null
  tag: AttendeeTag | null
  firstSeenAt: string
  lastActivityAt: string
  /** Distinct events they have registered for. */
  eventCount: number
  ticketCount: number
  /** Tickets actually used at a door. */
  checkedInCount: number
}

/** The counts behind the four pills, for the whole directory. */
export interface SegmentCountsWire {
  all: number
  new: number
  checkedIn: number
  vip: number
}

/** The three details an organizer may correct, as the row stores them. */
export const CONTACT_FIELDS = ['name', 'email', 'phone'] as const

export type ContactField = (typeof CONTACT_FIELDS)[number]

/** What the row holds right now — the values a save is measured against. */
export interface StoredContact {
  name: string
  email: string
  /** Absent when nobody ever left a number. */
  phone: string | null
}

/** What the edit panel's three inputs hold, as a form submits them. */
export interface ContactDraft {
  name: string
  email: string
  phone: string
}

/**
 * The body of `PATCH /attendees/:attendeeId` — only the fields that moved. An
 * absent key is left alone; `phone: ''` clears the number.
 */
export interface ContactPatch {
  name?: string
  email?: string
  phone?: string
}

export interface AttendeeRow {
  id: number
  name: string
  email: string
  initials: string
  /** `—` when they never left one; a blank cell reads as a rendering bug. */
  phone: string
  /**
   * The same details unformatted, for the panel that corrects them.
   *
   * Kept apart from the cells above because `phone` is already a dash by the
   * time the table reads it, and an edit seeded from that would PATCH "—" as
   * somebody's phone number.
   */
  contact: StoredContact
  /** `3 events`. */
  events: string
  tickets: number
  tag: AttendeeTag | null
  tagClass: string
  tagIcon: string
  /** `Jul 8, 2026`, on the Bangkok calendar. */
  lastActivity: string
}
