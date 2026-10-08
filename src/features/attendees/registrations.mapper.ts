import { MASKED, bangkokDate, bangkokTime, initials, satang } from '@/lib/format'
import type {
  Registration,
  RegistrationEntry,
  RegistrationStatus,
  RegistrationWireStatus,
} from './registrations.types'

/** Wire status → the kit's wording. A lookup, so a new status is one line. */
const STATUS_LABEL: Record<RegistrationWireStatus, RegistrationStatus> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

const PAID = 'paid'
const REJECT = 'Reject'
/** Said before the click: this rejection gives the buyer's money back (US-REG-02). */
const REJECT_AND_REFUND = 'Reject and refund'

/**
 * One queue row, display-ready (US-REG-01).
 *
 * The amount is derived from `totalSatang`, deliberately NOT from the API's
 * `amountLabel`: going through `satang()` keeps the null-vs-zero rule in one
 * tested place, so a withheld figure can never reach the table as `฿0`.
 *
 * `canApprove` / `canReject` and their reasons are passed through untouched —
 * the server decides what may be done and writes the refusal for the person
 * reading it, and the console's job is to show that, not to re-derive it.
 */
export function toRegistrationRow(entry: RegistrationEntry): Registration {
  return {
    id: entry.id,
    reference: entry.reference,
    initials: initials(entry.buyerName),
    name: entry.buyerName,
    email: entry.buyerEmail,
    event: entry.eventName,
    ticket: entry.ticketTypeName ?? MASKED,
    seats: entry.seats,
    date: bangkokDate(entry.registeredAt),
    amount: satang(entry.totalSatang),
    status: STATUS_LABEL[entry.status],
    canApprove: entry.canApprove,
    approveBlockedReason: entry.approveBlockedReason,
    canReject: entry.canReject,
    rejectBlockedReason: entry.rejectBlockedReason,
    rejectLabel: entry.rejectRefunds ? REJECT_AND_REFUND : REJECT,
    canOffer: entry.canOffer,
    offerHint: offerHintOf(entry.waitlistPosition),
    statusNote: statusNoteOf(entry),
  }
}

/**
 * Where a waitlist entry stands, or until when an offer holds its seat
 * (US-REG-04). The deadline is on Bangkok's clock, the one the attendee's
 * email gives them. A registration awaiting approval says so (US-REG-02) —
 * "Pending" alone reads as "not paid yet" — and a rejection still holding the
 * buyer's money says the refund has not gone through.
 */
function statusNoteOf(entry: RegistrationEntry): string | null {
  if (entry.status === 'waitlisted' && entry.waitlistPosition !== null) {
    return entry.waitlistPosition <= 1 ? 'Next in line' : `#${entry.waitlistPosition} in line`
  }
  if (entry.status === 'pending' && entry.awaitingApproval) {
    return entry.paymentStatus === PAID ? 'Paid · awaiting approval' : 'Awaiting approval'
  }
  if (entry.status === 'rejected' && entry.paymentStatus === PAID) {
    return 'Payment not yet refunded'
  }
  if (entry.status === 'pending' && entry.offerExpiresAt) {
    const until = entry.offerExpiresAt
    return `Offer open until ${bangkokDate(until)} ${bangkokTime(until)}`
  }
  return null
}

/**
 * Offering a seat to someone further back is allowed — the story says so —
 * but it passes people over, and the API records that. Said before the click.
 */
function offerHintOf(position: number | null): string {
  const ahead = (position ?? 1) - 1
  if (ahead <= 0) return 'Offer a seat'
  const people = ahead === 1 ? '1 person' : `${ahead} people`
  return `Offer a seat — ${people} ahead of them will be passed over, and that is recorded`
}
