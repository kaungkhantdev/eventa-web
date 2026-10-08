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

export interface AttendeeRow {
  id: number
  name: string
  email: string
  initials: string
  /** `—` when they never left one; a blank cell reads as a rendering bug. */
  phone: string
  /** `3 events`. */
  events: string
  tickets: number
  tag: AttendeeTag | null
  tagClass: string
  tagIcon: string
  /** `Jul 8, 2026`, on the Bangkok calendar. */
  lastActivity: string
}
