/**
 * What `/message-deliveries` returns (US-MSG-06).
 *
 * One row per message per recipient, written by eventa-worker as it sends.
 */

/**
 * What the transport said, and nothing more.
 *
 * Two values, not the kit's four. `delivered` needs a provider webhook and
 * `opened` needs a tracking pixel; this product has neither, so both would be
 * guesses dressed as evidence.
 */
export type DeliveryStatus = 'sent' | 'failed'

export interface DeliveryWire {
  id: string
  /** Catalog slug for an automated message, or `announcement`. */
  kind: string
  channel: string
  recipientEmail: string
  recipientName: string | null
  eventId: string | null
  /** Null when the event has since been deleted. */
  eventName: string | null
  status: DeliveryStatus
  /** Why it failed. Null on a successful send. */
  error: string | null
  /** UTC. */
  sentAt: string
}
