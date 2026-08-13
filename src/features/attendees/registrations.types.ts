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
}
