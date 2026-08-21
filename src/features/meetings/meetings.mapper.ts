import type {
  MeetingCard,
  MeetingMode,
  MeetingType,
  MeetingWire,
  SyncStatus,
  TypeStyle,
} from './meetings.types'

/** The rules behind the meetings list (US-MTG-01..06). */

const SEPARATOR = ' · '
const ALL_EVENTS = 'All events'

/** Icon and tint per type — copied from the kit's own chip map. */
export const TYPE_STYLE: Record<MeetingType, TypeStyle> = {
  Venue: {
    tint: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
    icon: 'hgi-building-03',
  },
  Sponsor: {
    tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
    icon: 'hgi-briefcase-01',
  },
  Vendor: {
    tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    icon: 'hgi-delivery-box-01',
  },
  Speaker: {
    tint: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
    icon: 'hgi-mic-01',
  },
  Internal: { tint: 'bg-brand-soft text-brand', icon: 'hgi-user-group' },
}

const MODE_STYLE: Record<MeetingMode, { icon: string; label: string; badge: string }> = {
  Video: { icon: 'hgi-video-01', label: 'Video call', badge: 'badge-blue' },
  'In person': { icon: 'hgi-location-01', label: 'In person', badge: 'badge-gray' },
  Phone: { icon: 'hgi-call-02', label: 'Phone', badge: 'badge-gray' },
}

/**
 * What to say when the calendar invite has not reached the guest.
 *
 * Surfaced rather than swallowed: a meeting whose invite never went out is one
 * only the organizer knows about, and they are the person who can chase it.
 */
const SYNC_NOTE: Record<SyncStatus, string | null> = {
  pending: 'The calendar invite has not been sent yet.',
  failed: "The calendar invite couldn't be sent.",
  synced: null,
  not_applicable: null,
}

export function toMeetingCard(wire: MeetingWire): MeetingCard {
  const mode = MODE_STYLE[wire.mode]
  return {
    id: wire.id,
    title: wire.title,
    type: wire.type,
    typeStyle: TYPE_STYLE[wire.type],
    mode: wire.mode,
    modeIcon: mode.icon,
    modeLabel: mode.label,
    modeBadge: mode.badge,
    bucket: wire.bucket,
    // Already written by the API, on the Bangkok clock and with the day it
    // belongs to. Re-deriving it here would be a second opinion about "today".
    when: wire.timeLabel,
    who: [wire.role ?? wire.type, wire.person].join(SEPARATOR),
    // A meeting with no event covers all of them. That is an answer, not a gap.
    event: wire.eventName ?? ALL_EVENTS,
    place: wire.place ?? '',
    link: wire.link,
    // The server decides both: it knows the meeting is video, not past, not
    // cancelled, and that the link is ready.
    canJoin: wire.canJoin,
    canEdit: wire.canEdit,
    syncNote: SYNC_NOTE[wire.syncStatus],
    cancellationReason: wire.cancellationReason,
    edit: {
      id: wire.id,
      title: wire.title,
      date: wire.date,
      startTime: clock(wire.startTime),
      endTime: clock(wire.endTime),
      type: wire.type,
      mode: wire.mode,
      person: wire.person,
      role: wire.role ?? '',
      guestEmail: wire.guestEmail,
      eventId: wire.eventId ?? '',
      notes: wire.notes ?? '',
      version: wire.version,
    },
  }
}

/**
 * `10:00:00` → `10:00`.
 *
 * Postgres returns a `time` as HH:MM:SS. It is a wall clock with no zone of its
 * own, so it is trimmed — never converted, which would move the meeting by the
 * reader's distance from Bangkok.
 */
function clock(time: string): string {
  return time.slice(0, 'HH:MM'.length)
}
