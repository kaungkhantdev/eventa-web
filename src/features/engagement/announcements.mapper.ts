import { bangkokDate, num } from '@/lib/format'
import type { AnnouncementWire } from './announcements.types'

/**
 * One sent announcement, as a row (US-MSG-04).
 *
 * The count reads "attendees", not "recipients": it is who the broadcast was
 * queued for, and eventa-worker resolves the real list when it sends. Calling
 * them recipients would claim a delivery this app has no way to know about —
 * that is US-MSG-06, and it needs a per-recipient record that does not exist.
 */

/** An event can be deleted after a broadcast; the broadcast still happened. */
const GONE = 'Deleted event'

export interface AnnouncementRow {
  id: string
  subject: string
  body: string
  /** "Tech Summit 2026 · 1,340 attendees · Jul 5, 2026" */
  meta: string
}

export function toAnnouncementRow(wire: AnnouncementWire): AnnouncementRow {
  return {
    id: wire.id,
    subject: wire.subject,
    body: wire.body,
    meta: [
      wire.eventName ?? GONE,
      attendees(wire.recipientCount),
      bangkokDate(wire.sentAt),
    ].join(' · '),
  }
}

function attendees(count: number): string {
  return `${num(count)} ${count === 1 ? 'attendee' : 'attendees'}`
}
