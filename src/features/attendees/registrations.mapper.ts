import { bangkokDate, initials, satang } from '@/lib/format'
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
    seats: entry.seats,
    date: bangkokDate(entry.registeredAt),
    amount: satang(entry.totalSatang),
    status: STATUS_LABEL[entry.status],
    canApprove: entry.canApprove,
    approveBlockedReason: entry.approveBlockedReason,
    canReject: entry.canReject,
    rejectBlockedReason: entry.rejectBlockedReason,
  }
}
