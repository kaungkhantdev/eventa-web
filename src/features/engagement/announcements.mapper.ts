import type { BadgeTone } from '@/components/ui'
import { bangkokDate, bangkokLocalInput, bangkokTime, num } from '@/lib/format'
import type { AnnouncementStatus, AnnouncementWire } from './announcements.types'

/**
 * One announcement, as a row (US-MSG-04/05) — sent, still to go, or called off.
 *
 * The count reads "attendees", not "recipients": it is who the broadcast was
 * queued for, and eventa-worker resolves the real list when it sends. Calling
 * them recipients would claim a delivery this app has no way to know about —
 * that is US-MSG-06, and it needs a per-recipient record that does not exist.
 */

/** An event can be deleted after a broadcast; the broadcast still happened. */
const GONE = 'Deleted event'

export interface AnnouncementBadge {
  tone: BadgeTone
  icon: string
  label: string
}

/** Sent and Scheduled are the kit's own badges; Cancelled follows registrations'. */
const BADGES: Record<AnnouncementStatus, AnnouncementBadge> = {
  sent: { tone: 'green', icon: 'hgi-tick-02', label: 'Sent' },
  scheduled: { tone: 'blue', icon: 'hgi-time-schedule', label: 'Scheduled' },
  cancelled: { tone: 'gray', icon: 'hgi-cancel-circle', label: 'Cancelled' },
}

/** What each state says after the event's name. */
const DETAIL: Record<AnnouncementStatus, (wire: AnnouncementWire) => string[]> = {
  sent: (wire) => [...attendees(wire.recipientCount), bangkokDate(wire.sentAt)],
  scheduled: (wire) => [`Scheduled for ${dueAt(wire.scheduledFor)}`],
  cancelled: (wire) => ['Cancelled', ...wasDue(wire.scheduledFor)],
}

export interface AnnouncementRow {
  id: string
  subject: string
  body: string
  status: AnnouncementStatus
  badge: AnnouncementBadge
  /**
   * Only a scheduled one can still be cancelled or moved. This tidies the UI;
   * the API's 409 is what actually refuses a change to one that has gone.
   */
  canChange: boolean
  /** Its time as the reschedule field's value, on the Bangkok clock; null once settled. */
  sendAtInput: string | null
  /** "Aug 5, 2026 · 10:00" — its Bangkok send time, for a confirmation. */
  when: string
  /** "Tech Summit 2026 · 1,340 attendees · Jul 5, 2026" */
  meta: string
}

export function toAnnouncementRow(wire: AnnouncementWire): AnnouncementRow {
  const canChange = wire.status === 'scheduled'
  return {
    id: wire.id,
    subject: wire.subject,
    body: wire.body,
    status: wire.status,
    badge: BADGES[wire.status],
    canChange,
    sendAtInput: canChange && wire.scheduledFor ? bangkokLocalInput(wire.scheduledFor) : null,
    when: dueAt(wire.scheduledFor),
    meta: [wire.eventName ?? GONE, ...DETAIL[wire.status](wire)].join(' · '),
  }
}

/**
 * Nothing when nobody has counted yet: null is "not counted", and rendering
 * it as "0 attendees" would state a fact nobody has established.
 */
function attendees(count: number | null): string[] {
  if (count === null) return []
  return [`${num(count)} ${count === 1 ? 'attendee' : 'attendees'}`]
}

function dueAt(instant: string | null): string {
  return `${bangkokDate(instant)} · ${bangkokTime(instant)}`
}

function wasDue(instant: string | null): string[] {
  return instant ? [`was due ${dueAt(instant)}`] : []
}
