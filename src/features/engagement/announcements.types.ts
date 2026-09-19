/**
 * What `/announcements` returns (US-MSG-04).
 *
 * A history of broadcasts already sent. There is no scheduled state and no
 * audience: the send path takes one event's confirmed attendees by email, so
 * everything listed here has already gone out to all of them.
 */
export interface AnnouncementWire {
  id: string
  eventId: string
  /** Null when the event has since been deleted — the send still happened. */
  eventName: string | null
  subject: string
  body: string
  /**
   * Attendees at the moment it was queued: what the organizer was told they
   * were writing to, NOT a delivery receipt. Proving delivery is US-MSG-06.
   */
  recipientCount: number
  /** UTC. */
  sentAt: string
}
