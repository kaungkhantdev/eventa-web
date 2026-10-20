import type { Persona } from '@/lib/persona'

/** The auth module's named constants. */

export const ACCEPT_INVITE_INCOMPLETE_LINK =
  'This invitation link is incomplete. Open the link from your email again, or ask an admin to re-send it.'

/**
 * The typo guard's words, for every form that asks for a password twice — both
 * attendee sign-ups (the ordinary form and the one opened from a booking's
 * emailed link, US-DISC-15), the password reset and the invitation — so they
 * cannot drift apart.
 */
export const PASSWORDS_DIFFER = 'Those passwords do not match.'

/** Where an account is made from a booking (US-DISC-15). */
export const FROM_BOOKING = '/auth/register/from-booking'

export const INCOMPLETE_CONFIRM_LINK =
  'This confirmation link is incomplete. Open the most recent link in your email, or change your email again.'

/**
 * Must equal `PASSWORD_MIN_LENGTH` in eventa-api's `src/common/constants/auth-password.constants.ts`,
 * which is what `RegisterDto`, `ResetPasswordDto` and `ChangePasswordDto` all
 * enforce. Two repos, one number — change both together or the meter starts
 * lying again.
 */
export const MIN_PASSWORD_LENGTH = 8

/**
 * The rest of the API's `PASSWORD_PATTERN`: a number and a symbol (US-SET-02).
 * A symbol is anything that is not a letter, a combining mark or a number, so
 * a Thai letter or vowel sign never passes for one.
 */
export const DIGIT = /\d/
export const SYMBOL = /[^\p{L}\p{M}\p{N}]/u

/** A comfortable length, which earns the last point. */
export const STRONG_LENGTH = 12

export const STRENGTH_COLORS: Record<1 | 2 | 3, string> = {
  1: '#ef4444',
  2: '#d97706',
  3: '#1ba770',
}

export const STRENGTH_TEXTS: Record<0 | 1 | 2 | 3, string> = {
  0: `Use ${MIN_PASSWORD_LENGTH}+ characters with a number and a symbol`,
  1: 'Weak password',
  2: 'Fair password',
  3: 'Strong password',
}

export const SIGN_IN_PATH: Record<Persona, string> = {
  admin: '/auth/login',
  attendee: '/portal/login',
}

/**
 * Where each audience opens an account. The portal's "Create an event" reaches
 * for the organizer's: an attendee account is the wrong thing entirely, and
 * signing one up would strand a would-be organizer outside /admin holding
 * credentials that look correct.
 */
export const SIGN_UP_PATH: Record<Persona, string> = {
  admin: '/auth/register',
  attendee: '/portal/register',
}

/**
 * Where a fresh sign-in lands, when the guard has no `?from=` to honour.
 *
 * The organizer's is Home, not Dashboard — the same place `/admin` itself
 * redirects to and the first stop on the rail. Signing in is arriving at work,
 * not asking for the metrics screen.
 */
export const HOME_PATH: Record<Persona, string> = {
  admin: '/admin/home',
  attendee: '/portal/my-events',
}

/**
 * Where sign-up ends. Not a banner over the form: the account already exists,
 * nothing on that form can usefully be edited any more, and the only thing left
 * to do happens in an email client.
 */
export const CHECK_EMAIL_PATH: Record<Persona, string> = {
  admin: '/auth/register/check-email',
  attendee: '/portal/register/check-email',
}

/**
 * Where each audience resets a password. ONE page serves both, and the realm
 * it searches comes from `?persona=` — so the link has to carry it.
 *
 * Reached without it, an attendee is looked for among organizers and never
 * found, while the page answers "a link is on its way" regardless, because it
 * must: a reset form that distinguished a registered address from an unknown
 * one would be a list of everyone with an account.
 */
export const FORGOT_PATH: Record<Persona, string> = {
  admin: '/auth/forgot-password',
  attendee: '/auth/forgot-password?persona=attendee',
}

/**
 * What each audience's account is called, for a screen to say out loud.
 *
 * Naming the realm is safe where naming the ADDRESS's realm would not be: this
 * comes from the URL the visitor is already looking at, not from a lookup, so
 * it tells an attacker nothing they did not type themselves.
 */
export const ACCOUNT_LABEL: Record<Persona, string> = {
  admin: 'Organizer account',
  attendee: 'Attendee account',
}

/** Matches the API's VERIFY_RESEND_COOLDOWN_SECONDS default. */
export const RESEND_COOLDOWN_MS = 60_000

export const KEY_PREFIX = 'eventa:resend-until:'

export const HEADING = 'Set a new password'

/** Fixed by the link the API emails: `${PUBLIC_WEB_URL}/reset-password?token=…`. */
export const TOKEN_PARAM = 'token'

export const RESET_PASSWORD_INCOMPLETE_LINK =
  'This reset link is incomplete. Open the most recent link in your email, or request a new one.'

/** The query key `/auth/login` reads to prefill the workspace field. */
export const ORG_PARAM = 'org'

export const NO_TOKEN =
  'This confirmation link is incomplete. Open the most recent link in your email, or request a new one.'
