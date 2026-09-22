/**
 * The registrations queue (US-REG-01), as `GET /registrations` describes it.
 *
 * `RegistrationEntry` mirrors the API's `RegistrationEntryDto` exactly — it is
 * the wire shape, and nothing outside the mapper should read it. `Registration`
 * is what the page renders.
 */

/** Order status, as the API's `order_status` enum spells it. */
export type RegistrationWireStatus =
  | 'confirmed'
  | 'pending'
  | 'waitlisted'
  | 'cancelled'
  | 'rejected'

/** The same, Title-Cased for display — the kit's own wording. */
export type RegistrationStatus =
  | 'Confirmed'
  | 'Pending'
  | 'Waitlisted'
  | 'Cancelled'
  | 'Rejected'

export interface RegistrationEntry {
  id: string
  reference: string
  eventId: string
  eventName: string
  buyerName: string
  buyerEmail: string
  status: RegistrationWireStatus
  paymentStatus: string
  seats: number
  /**
   * The tier bought, or every tier comma-joined on a mixed order. Null once the
   * tier has been hard-deleted — NOT a masked field: what someone bought is not
   * the same privilege as what they paid, so it is shown without `finView`.
   */
  ticketTypeName: string | null
  /** Integer satang, or null when the caller lacks `finView` (US-REG-01). */
  totalSatang: number | null
  /** The API's own rendering. We derive from `totalSatang` instead — see mapper. */
  amountLabel: string | null
  registeredAt: string
  confirmedAt: string | null
  rejectedAt: string | null
  cancelledAt: string | null
  canApprove: boolean
  approveBlockedReason: string | null
  canReject: boolean
  rejectBlockedReason: string | null
  /** On the waitlist, so a seat may be offered (US-REG-04). */
  canOffer: boolean
  /** Place in line for its ticket, 1 = next; null unless waitlisted. */
  waitlistPosition: number | null
  /** When a waitlist offer lapses and passes on; set once one is made. */
  offerExpiresAt: string | null
  /**
   * Waiting for the organizer's decision on an event that requires approval
   * (US-REG-02) — paid for already if it cost anything.
   */
  awaitingApproval: boolean
  /** Rejecting it refunds its payment: it was paid for while it waited. */
  rejectRefunds: boolean
}

/** Live tab totals for the whole filtered queue, whichever tab is open. */
export interface RegistrationCounts {
  pending: number
  confirmed: number
  waitlisted: number
  cancelled: number
  rejected: number
}

/** A row as the table renders it — every field already display-ready. */
export interface Registration {
  id: string
  reference: string
  initials: string
  name: string
  email: string
  event: string
  /** The tier bought — `VIP`, `Early Bird, VIP`, or `—` if it was deleted. */
  ticket: string
  seats: number
  date: string
  /** `฿2,400`, `Free`, or `—` when withheld. Never `฿0`. */
  amount: string
  status: RegistrationStatus
  canApprove: boolean
  /** The API's own sentence, shown verbatim when the action is refused. */
  approveBlockedReason: string | null
  canReject: boolean
  rejectBlockedReason: string | null
  /** What Reject will do — `Reject and refund` when it gives money back. */
  rejectLabel: string
  canOffer: boolean
  /** What the Offer button says it will do — including who it passes over. */
  offerHint: string
  /**
   * A line under the badge: place in line, until when an offer holds, that it
   * awaits approval, or that a rejection's refund is still owed.
   */
  statusNote: string | null
}
