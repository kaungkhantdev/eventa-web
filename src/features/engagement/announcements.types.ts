/**
 * What `/announcements` returns (US-MSG-04/05).
 *
 * A history of broadcasts: sent, still to go, or called off. There is no
 * audience: the send path takes one event's confirmed attendees by email.
 */

/** Only a `scheduled` one can still be cancelled or moved. */
export type AnnouncementStatus = 'scheduled' | 'sent' | 'cancelled'

export interface AnnouncementWire {
  id: string
  eventId: string
  /** Null when the event has since been deleted — the send still happened. */
  eventName: string | null
  subject: string
  body: string
  status: AnnouncementStatus
  /** When a scheduled one is (or was) due, UTC. Null for one sent straight away. */
  scheduledFor: string | null
  /** When it went, UTC. Null until then, and for a cancelled one. */
  sentAt: string | null
  /** UTC. */
  cancelledAt: string | null
  /**
   * Attendees at the moment it was queued: what the organizer was told they
   * were writing to, NOT a delivery receipt. Proving delivery is US-MSG-06.
   * Null until it has gone — a scheduled one is counted when it is sent, and
   * null is not "nobody".
   */
  recipientCount: number | null
}
