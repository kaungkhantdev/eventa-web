import { MASKED, bangkokDate, bangkokTime, initials, satang } from '@/lib/format'
import type {
  Registration,
  RegistrationEntry,
  RegistrationStatus,
  RegistrationWireStatus,
} from './registrations.types'

/**
 * Wire status → the kit's wording. A lookup, so a new status is one line.
 *
 * Deliberately an exhaustive `Record` with NO `??` fallback, and the badge map
 * in `registrations.presentation.ts` is deliberately the same. The choice is
 * between failing at compile time and degrading at runtime, and this path is
 * better off failing at compile time:
 *
 * A fallback would have turned this defect into a quiet one. The bug was not a
 * missing default — it was this union being a member short of the API enum,
 * and an exhaustive `Record` is what makes that a build error the moment the
 * union is corrected. Add a seventh value to `RegistrationWireStatus` and
 * `tsc` names this object and the badge map until both are filled in; nobody
 * has to notice a row looking odd in production. Keyed by a value NOT in the
 * union, this returns `undefined` and the row crashes — loud and immediate,
 * which is the runtime behaviour we want when the contract has drifted again.
 *
 * That crash is not a test guarantee, and it would be comfortable to pretend
 * otherwise: the spec's list of API values is hand-maintained too, and
 * `satisfies` only proves the list is a subset of the union — it cannot force
 * the list to grow when the API does. A seventh status appearing upstream is
 * caught here at the moment somebody widens the union, and in production
 * otherwise.
 *
 * A neutral fallback would be the more robust choice for a lookup fed by
 * genuinely open-ended input. This one is not: every value it can receive is
 * fixed by a database enum that the DTO republishes verbatim, so the complete
 * set is knowable at build time. Defaulting here would buy a soft landing at
 * the price of never being told to update the list — which is precisely how a
 * cancelled-looking row that is really an expired one would reach whoever is
 * reconciling the money, and that is a worse outcome than a build failure.
 */
const STATUS_LABEL: Record<RegistrationWireStatus, RegistrationStatus> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  expired: 'Expired',
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
