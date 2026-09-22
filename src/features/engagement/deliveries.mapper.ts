import type { BadgeTone } from '@/components/ui'
import { bangkokTime, initials } from '@/lib/format'
import type { DeliveryStatus, DeliveryWire } from './deliveries.types'

/**
 * One line of the delivery log (US-MSG-06).
 *
 * The status wording is the point of this file. The kit drew four states —
 * Delivered, Opened, Sent, Failed — and only two of them are knowable: the
 * transport either took the message or threw. "Delivered" would need a provider
 * webhook and "Opened" a tracking pixel, and inventing either would turn a log
 * an organizer uses to chase a missing ticket into a reassuring fiction.
 */

export interface DeliveryRow {
  id: string
  /** The person, or their address when nobody was named. */
  name: string
  /** Null when the name IS the address — printing it twice reads as a bug. */
  email: string | null
  initials: string
  kind: string
  /** Null when the message was not about an event. */
  event: string | null
  status: { label: string; tone: BadgeTone; icon: string }
  /** Why it failed; null on a successful send. */
  error: string | null
  /** "Jul 9 · 10:24" */
  sentAt: string
}

const STATUS: Record<
  DeliveryStatus,
  { label: string; tone: BadgeTone; icon: string }
> = {
  sent: { label: 'Sent', tone: 'blue', icon: 'hgi-mail-send-01' },
  failed: { label: 'Failed', tone: 'red', icon: 'hgi-alert-circle' },
}

/**
 * Names this app knows, because a slug is not a sentence. Anything else is made
 * readable rather than shown raw — `kind` is free text from the worker, so a
 * new message type will appear here before this list does.
 */
const KIND_LABEL: Record<string, string> = {
  'registration-confirmation': 'Registration confirmation',
  'cancellation-notice': 'Cancellation notice',
  'payment-receipt': 'Payment receipt',
  'event-reminder': 'Event reminder',
  'waitlist-offer': 'Waitlist offer',
  // Sent under the offer's own switch, logged apart so it is not read as one.
  'waitlist-offer-expired': 'Waitlist offer expired',
  'post-event-thankyou': 'Post-event thank-you',
  announcement: 'Announcement',
  'refund-notice': 'Refund notice',
}

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? sentenceCase(kind)
}

function sentenceCase(slug: string): string {
  const words = slug.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function toDeliveryRow(wire: DeliveryWire): DeliveryRow {
  // An address is a poor name, but a blank one reads as a broken row.
  const name = wire.recipientName ?? wire.recipientEmail
  return {
    id: wire.id,
    name,
    email: wire.recipientName ? wire.recipientEmail : null,
    initials: initials(name),
    kind: kindLabel(wire.kind),
    event: wire.eventName,
    status: STATUS[wire.status],
    error: wire.error,
    sentAt: `${dayOf(wire.sentAt)} · ${bangkokTime(wire.sentAt)}`,
  }
}

/** "Jul 9" — the year is noise in a log that is read newest-first. */
function dayOf(instant: string): string {
  return new Date(instant).toLocaleDateString('en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
    day: 'numeric',
  })
}
