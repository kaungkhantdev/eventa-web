import type { BookingClaim } from '@/features/auth/api'

/**
 * The attendee sign-up at `/portal/register` (US-DISC-08, US-DISC-15) — opened
 * directly, or from the one-time link emailed to a booking's address when its
 * buyer asks to keep the tickets (`?claim=<token>`).
 */
export type PortalRegisterData =
  /** No link: the ordinary sign-up, confirmed by email before it can be used. */
  | { mode: 'direct' }
  /** A link the API vouched for, and whose it is. */
  | { mode: 'claim'; claim: BookingClaim }
  /** A link that cannot be used — expired, used, or never valid. */
  | { mode: 'claim-invalid'; error: string }

/** A claim that did not go through. One that did redirects to My Events. */
export interface ClaimRefusal {
  ok: false
  /** The API's own sentence, shown verbatim — it was written for the reader. */
  error: string
  /** Whether the refusal could be about the link, so the page checks it again. */
  recheck: boolean
}

/** Which of the page's screens to show, and what it says. */
export type RegisterScreen =
  | { kind: 'direct' }
  /** Name and email are the booking's, shown fixed; only a password is asked for. */
  | { kind: 'claim'; name: string; email: string; error: string | null }
  /** The address already has an account — this link has been used, or was not needed. */
  | { kind: 'exists'; message: string; signInTo: string }
  | { kind: 'invalid'; error: string; advice: string; signInTo: string }
