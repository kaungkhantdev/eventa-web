import { MASKED, bangkokTime, initials } from '@/lib/format'
import type {
  AttendanceCountsWire,
  AttendanceRow,
  AttendanceWire,
  DoorCounts,
  ScanFeedback,
  ScanResultWire,
} from './door.types'

/**
 * The door's rules (US-REG-11/12/13).
 *
 * The station's five outcomes are five different things for the person on the
 * door to do, so they never collapse into "no": an unknown code, a ticket for
 * next week's event and a refunded one each need a different sentence.
 */

const UNNAMED = 'Unnamed ticket'
const UNKNOWN = 'Unknown ticket'

export function toAttendanceRow(wire: AttendanceWire): AttendanceRow {
  const checkedIn = wire.status === 'checked_in'
  return {
    ticketId: wire.ticketId,
    // A ticket can be issued without naming anybody. It is still one seat, and
    // the door still has to show a row for it.
    name: wire.holderName ?? UNNAMED,
    initials: wire.holderName ? initials(wire.holderName) : MASKED,
    email: wire.attendeeEmail ?? '',
    ticketType: wire.ticketTypeName,
    checkedIn,
    time: checkedIn ? bangkokTime(wire.checkedInAt) : MASKED,
  }
}

export function toDoorCounts(counts: AttendanceCountsWire): DoorCounts {
  return {
    checkedIn: counts.checkedIn,
    expected: counts.expected,
    total: counts.total,
    // Both the API's, counted over the whole event. Never worked out from the
    // rows on screen: the station shows eight arrivals out of a thousand.
    onSite: counts.onSite,
    late: counts.late,
    // An event nobody has booked is not a full house.
    percent: counts.total === 0 ? 0 : Math.round((counts.checkedIn / counts.total) * 100),
  }
}

interface Outcome {
  tone: ScanFeedback['tone']
  title: string
  detail: string
}

/**
 * What the station says, per outcome.
 *
 * A lookup rather than a chain, so a sixth outcome the API grows is one row
 * here — and, until it is added, falls to something honest rather than to
 * "checked in".
 *
 * The keys are the API's `scan_outcome` values spelled exactly as they arrive,
 * never a local alias: a key this repo renames for readability stops matching
 * the wire, and the refusal it was meant to explain lands on the fallback
 * instead, which tells the door to admit the person anyway.
 */
const OUTCOMES: Record<ScanResultWire['outcome'], Outcome> = {
  admitted: { tone: 'ok', title: 'Checked in', detail: 'Welcome — let them through.' },
  already_checked_in: { tone: 'dupe', title: 'Already checked in', detail: '' },
  invalid: { tone: 'invalid', title: 'Not a valid ticket', detail: 'This code is not one of ours.' },
  wrong_event: { tone: 'wrong', title: 'Wrong event', detail: 'This ticket is for another event.' },
  cancelled: { tone: 'void', title: 'Entry denied', detail: 'This ticket has been refunded or voided.' },
}

const UNRECOGNISED: Outcome = {
  tone: 'invalid',
  title: 'Could not read that',
  detail: 'Try again, or admit them by name.',
}

export function toScanFeedback(result: ScanResultWire): ScanFeedback {
  const outcome = OUTCOMES[result.outcome] ?? UNRECOGNISED
  return {
    tone: outcome.tone,
    title: outcome.title,
    name: result.holderName ?? UNKNOWN,
    // "Already checked in" is only useful with the time they actually arrived.
    detail:
      result.outcome === 'already_checked_in' && result.checkedInAt
        ? `Arrived at ${bangkokTime(result.checkedInAt)}`
        : outcome.detail,
  }
}
