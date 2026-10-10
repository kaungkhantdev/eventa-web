import { MASKED, bangkokDate, initials } from '@/lib/format'
import type { AttendeeRow, AttendeeTag, AttendeeWire } from './directory.types'

/** The rules behind the attendee directory (US-CHK-06/07). */

/** Badge tint and glyph per tag — the kit's own map. */
const TAG_BADGE: Record<AttendeeTag, { cls: string; icon: string }> = {
  VIP: { cls: 'badge-amber', icon: 'hgi-star' },
  Speaker: { cls: 'badge-purple', icon: 'hgi-mic-01' },
  Sponsor: { cls: 'badge-blue', icon: 'hgi-building-03' },
  Student: { cls: 'badge-green', icon: 'hgi-mortarboard-02' },
}

export function toAttendeeRow(wire: AttendeeWire): AttendeeRow {
  const badge = wire.tag ? TAG_BADGE[wire.tag] : null
  return {
    id: wire.id,
    name: wire.name,
    email: wire.email,
    initials: initials(wire.name),
    // An unrecorded phone number is a dash, not an empty cell — a blank reads
    // as a column that failed to render.
    phone: wire.phone ?? MASKED,
    contact: {
      name: wire.name,
      email: wire.email,
      phone: wire.phone,
      // `?? null` although the type says otherwise: an API deployed before the
      // field existed simply omits it, and that must cost the organizer the
      // guard, not the save.
      version: wire.version ?? null,
    },
    events: `${wire.eventCount} ${wire.eventCount === 1 ? 'event' : 'events'}`,
    tickets: wire.ticketCount,
    tag: wire.tag,
    tagClass: badge?.cls ?? '',
    tagIcon: badge?.icon ?? '',
    lastActivity: bangkokDate(wire.lastActivityAt),
  }
}
