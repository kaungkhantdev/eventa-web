import { bangkokDate, bangkokTime, satangAmount } from '@/lib/format'
import type {
  DeleteAccountBody,
  DeletionWarning,
  DeletionWarningWire,
  ForfeitedOrder,
  LoginSessionWire,
  TwoFactorCard,
  TwoFactorWire,
  UpcomingPaidOrderWire,
} from './security.types'

/**
 * The Security card's and the danger zone's rules (US-DISC-12 criteria 4–5,
 * US-DISC-14).
 *
 * Both were ported inert — a disabled "Change", a switch that could not be
 * moved, a "Delete account" button with no handler — on the grounds that the
 * portal kit draws none of the markup the flows need. The flows exist on the
 * API and in the organizer console; what lives here is the handful of
 * decisions that are easy to get quietly wrong: how many recovery codes are
 * really left, what money somebody is about to walk away from, and the two
 * gates in front of an action nothing can undo.
 *
 * Nothing in this file keeps a secret. A password, a 2FA code and a recovery
 * code pass through as values and are never stored, logged or put in a URL.
 */

/* ------------------------------- two-factor ------------------------------ */

/** The kit's own subtitle, kept for the one state it actually describes. */
const NEVER_SET_UP = 'Extra security at sign-in'
/** An enrolment that was started and abandoned — a seed with nothing behind it. */
const UNFINISHED = 'Setup was started but never finished'

export function toTwoFactorCard(wire: TwoFactorWire): TwoFactorCard {
  return {
    enabled: wire.enabled,
    pending: wire.pending,
    recoveryCodesRemaining: wire.recoveryCodesRemaining,
    status: statusOf(wire),
  }
}

function statusOf(wire: TwoFactorWire): string {
  if (wire.enabled) return `On · ${recoveryCodesLeft(wire.recoveryCodesRemaining)}`
  return wire.pending ? UNFINISHED : NEVER_SET_UP
}

/**
 * How many one-time codes are still good.
 *
 * Zero is said in words rather than as a figure, because it is the one count
 * on this card that is a warning: somebody who loses their authenticator with
 * no codes left has no way back into their own account.
 */
function recoveryCodesLeft(remaining: number): string {
  if (remaining === 0) return 'no recovery codes left'
  return `${remaining} recovery ${remaining === 1 ? 'code' : 'codes'} left`
}

/**
 * How many OTHER devices hold a session.
 *
 * The current one is excluded because it is never offered a sign-out — doing
 * so would sign the reader out of the page they are standing on — so counting
 * it would promise one more device than the control can reach.
 */
export function countOtherDevices(wires: readonly LoginSessionWire[]): number {
  return wires.filter((wire) => !wire.isCurrent).length
}

/* ----------------------------- the danger zone --------------------------- */

/**
 * The exact phrase the danger zone makes somebody type.
 *
 * `DELETE_CONFIRMATION` in eventa-api's `DeleteAccountDto`, which checks it
 * again with `@Equals` — this is the gate, not the check.
 */
export const DELETE_CONFIRMATION = 'DELETE'

export function toDeletionWarning(wire: DeletionWarningWire): DeletionWarning {
  return {
    requiresTwoFactorCode: wire.requiresTwoFactorCode,
    orders: wire.upcomingPaidOrders.map(toForfeitedOrder),
    // An empty list has nothing at risk. `satang()` would answer "Free" and
    // `satangAmount()` "฿0"; both read as a priced forfeit of nothing.
    totalAtRisk:
      wire.upcomingPaidOrders.length === 0 ? null : satangAmount(wire.totalAtRiskSatang),
  }
}

/**
 * One order, in Bangkok time.
 *
 * Deliberately not the event's own timezone, which is what `toMyEventRow`
 * uses: `UpcomingPaidOrderDto` carries no timezone, and inventing one would be
 * worse than the house default for a line whose job is to be recognised.
 */
function toForfeitedOrder(wire: UpcomingPaidOrderWire): ForfeitedOrder {
  return {
    reference: wire.reference,
    eventName: wire.eventName,
    when: `${bangkokDate(wire.startAt)} · ${bangkokTime(wire.startAt)}`,
    tickets: `${wire.ticketCount} ${wire.ticketCount === 1 ? 'ticket' : 'tickets'}`,
    // A paid order, so never masked and never free — this is the figure the
    // reader forfeits, which must read as money even at ฿0.
    amount: satangAmount(wire.totalSatang),
  }
}

/**
 * Has the reader typed the phrase?
 *
 * Space either side is forgiven — a phone keyboard adds it unasked — but the
 * case is not: the API compares exactly, so accepting "delete" here would send
 * a body it answers with a validation error nothing on screen could explain.
 */
export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim() === DELETE_CONFIRMATION
}

/** What `DELETE /me/account` is actually sent. */
export function toDeleteBody(form: FormData): DeleteAccountBody {
  const code = field(form, 'code')
  return {
    // The typed phrase, trimmed — not the constant. The client gates on it,
    // and the API still gets to refuse what was really typed.
    confirm: field(form, 'confirm'),
    password: String(form.get('password') ?? ''),
    // Absent rather than blank: `code` is optional with a minimum length, so
    // an empty string is a 422 where "not enrolled" was meant.
    ...(code ? { code } : {}),
  }
}

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim()
}

/* ------------------------------- passwords ------------------------------- */

/**
 * Do the two new-password boxes disagree?
 *
 * Checked in the browser and only in the browser: it is a typo guard, not a
 * security rule, and the API has no business being told the same secret twice
 * to compare it. Length and composition are the server's rules and come back
 * as its own sentence.
 *
 * An unfilled confirmation counts as a disagreement — `null !== 'x'` happens
 * to give the right answer, and this says so on purpose rather than by luck.
 */
export function passwordsMismatch(form: FormData): boolean {
  return form.get('newPassword') !== form.get('confirmPassword')
}

/* ----------------------------- recovery codes ---------------------------- */
