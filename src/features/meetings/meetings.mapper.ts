import type {
  MeetingCard,
  MeetingMode,
  MeetingType,
  MeetingWire,
  SyncStatus,
  TypeStyle,
} from './meetings.types'
import { MEETING_MODE_LABEL } from './meetings.presentation'
import type { CalendarConnectionStatus } from '@/features/settings/calendarConnection.api'
import { ALL_EVENTS, SEPARATOR } from '@/lib/constants/meetings.constants'

/** The rules behind the meetings list (US-MTG-01..08). */

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

// The label comes from the panel's wording, so the badge repeats what the
// organizer chose there (US-MTG-03).
const MODE_STYLE: Record<MeetingMode, { icon: string; label: string; badge: string }> = {
  Video: { icon: 'hgi-video-01', label: MEETING_MODE_LABEL.Video, badge: 'badge-blue' },
  'In person': {
    icon: 'hgi-location-01',
    label: MEETING_MODE_LABEL['In person'],
    badge: 'badge-gray',
  },
  Phone: { icon: 'hgi-call-02', label: MEETING_MODE_LABEL.Phone, badge: 'badge-gray' },
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
  // Nothing went wrong and nothing will, until a calendar is connected — which
  // is the organizer's to do, so it is said rather than left as a blank the
  // reader would take for "the invite went out".
  not_connected: 'No calendar is connected, so no invite was sent.',
}

/**
 * A cancelled meeting's invite is withdrawn, not sent (US-MTG-06), so the
 * scheduled card's notes would ask for an invite to a meeting that is not
 * happening. Only a withdrawal that failed is worth a word: the guest still
 * has the meeting in their calendar.
 */
const CANCELLED_SYNC_NOTE: Record<SyncStatus, string | null> = {
  pending: null,
  failed: "The cancellation couldn't be sent to the guest's calendar.",
  synced: null,
  not_connected: null,
}

export function toMeetingCard(wire: MeetingWire): MeetingCard {
  const mode = MODE_STYLE[wire.mode]
  const cancelled = wire.status === 'cancelled'
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
    cancelled,
    // A lookup miss yields `undefined`, which is falsy and so renders as the
    // same blank as "nothing to report" — a status whose copy was never
    // written would look correct on screen. The card promises `string | null`,
    // so an unrecognised status is normalised to a deliberate silence instead.
    // Every value the API can send has a row above, so nothing real lands here.
    syncNote: (cancelled ? CANCELLED_SYNC_NOTE : SYNC_NOTE)[wire.syncStatus] ?? null,
    syncStatus: wire.syncStatus,
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
 * What a card whose invite has not gone out offers (US-MTG-04, US-MTG-08).
 *
 * - `retry` — "Send it now": the invite is on its way or failed, or it was
 *   saved while disconnected and the calendar is connected now.
 * - `connect` — a link to Settings → Integrations, for someone who can
 *   connect the calendar there.
 * - `ask_admin` — the same fact for someone who cannot, with who can.
 */
export type SyncAction = 'retry' | 'connect' | 'ask_admin'

export function syncActionOf(
  card: Pick<MeetingCard, 'syncNote' | 'syncStatus'>,
  calendarStatus: CalendarConnectionStatus,
  canManage: boolean,
): SyncAction | null {
  if (!card.syncNote) return null
  if (card.syncStatus !== 'not_connected' || calendarStatus === 'connected') return 'retry'
  return canManage ? 'connect' : 'ask_admin'
}

/**
 * The meetings on this page whose invite is still on its way, as one string.
 *
 * It keys the page's poll: the budget restarts only when this set changes, so
 * a worker that never answers costs a bounded number of reads per set rather
 * than one every few seconds forever. Sorted, so the same set listed in a
 * different order is not mistaken for a new one.
 */
export function pendingKeyOf(cards: readonly MeetingCard[]): string {
  return cards
    .filter((card) => !card.cancelled && card.syncStatus === 'pending')
    .map((card) => card.id)
    .sort()
    .join(',')
}

/** Whether anything on the page is waiting for the worker to send an invite. */
export function shouldPollSync(cards: readonly MeetingCard[]): boolean {
  return pendingKeyOf(cards) !== ''
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
