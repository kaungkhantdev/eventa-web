/** Meetings with venues, sponsors, vendors and speakers (US-MTG-01..06). */

export type MeetingType = 'Venue' | 'Sponsor' | 'Vendor' | 'Speaker' | 'Internal'

export type MeetingMode = 'Video' | 'In person' | 'Phone'

export type MeetingBucket = 'today' | 'upcoming' | 'past'

/**
 * The whole of the API's `meeting_status` pgEnum, which has exactly two values.
 *
 * There is deliberately no `completed`: whether a meeting has happened is
 * derived from its date, never stored, so the API has no such status to send.
 * Declaring one here would type-check clean in both repos while inviting a
 * branch that can never run.
 */
export type MeetingStatus = 'scheduled' | 'cancelled'

/**
 * Whether the calendar invite has gone out yet (US-MTG-04) — the whole of the
 * API's `meeting_sync_status` pgEnum, spelled exactly as the API spells it.
 */
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'not_connected'

export interface MeetingWire {
  id: string
  title: string
  /** The Bangkok calendar day, `YYYY-MM-DD`. */
  date: string
  /** `HH:MM:SS` wall clock — a time of day, with no zone of its own. */
  startTime: string
  endTime: string
  /** The UTC instant, resolved from the Bangkok wall clock. */
  startsAt: string
  /** e.g. `Today · 09:00 – 10:00`. Derived per request, never stored. */
  timeLabel: string
  bucket: MeetingBucket
  isToday: boolean
  type: MeetingType
  mode: MeetingMode
  status: MeetingStatus
  person: string
  role: string | null
  guestEmail: string
  eventId: string | null
  /** Null for a general meeting covering every event. */
  eventName: string | null
  /** The join link, the venue, or "Phone call". */
  place: string | null
  link: string | null
  notes: string | null
  syncStatus: SyncStatus
  /** Video, not past, link ready, not cancelled. */
  canJoin: boolean
  canEdit: boolean
  cancellationReason: string | null
  version: number
}

export interface MeetingCountsWire {
  all: number
  today: number
  upcoming: number
  past: number
}

/** How a type is drawn — the kit's own chip. */
export interface TypeStyle {
  tint: string
  icon: string
}

export interface MeetingCard {
  id: string
  title: string
  type: MeetingType
  typeStyle: TypeStyle
  mode: MeetingMode
  modeIcon: string
  modeLabel: string
  modeBadge: string
  bucket: MeetingBucket
  /** `Today · 09:00 – 10:00`, straight from the API. */
  when: string
  /** `Venue Coordinator · Sophia Reynolds`. */
  who: string
  /** The event it covers, or "All events" for a general one. */
  event: string
  /** Where it happens: a link, a venue, or "Phone call". */
  place: string
  link: string | null
  canJoin: boolean
  canEdit: boolean
  /** Set when the calendar invite has not gone out — surfaced, not hidden. */
  syncNote: string | null
  cancellationReason: string | null
  /** Everything the edit form needs, so a click opens it filled in. */
  edit: MeetingDraft
}

export interface MeetingDraft {
  id: string
  title: string
  date: string
  /** `09:00` — what an `<input type="time">` wants. */
  startTime: string
  endTime: string
  type: MeetingType
  mode: MeetingMode
  person: string
  role: string
  guestEmail: string
  eventId: string
  notes: string
  version: number
}
