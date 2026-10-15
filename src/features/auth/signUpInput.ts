import type { Persona } from '@/lib/persona'

/**
 * The typo guard's words, for both attendee sign-ups — the ordinary form and
 * the one opened from a booking's emailed link (US-DISC-15) — so they cannot
 * drift apart.
 */
export const PASSWORDS_DIFFER = 'Those passwords do not match.'

/**
 * The sign-up form, as `POST /auth/register` wants it.
 *
 * The mirror of `credentialsOf`, and a named function for the same reason: the
 * workspace is the field that differs between the two audiences, and it is
 * dropped here — at the one place both sign-up pages go through — rather than
 * trusted not to be filled in. The API refuses a workspace for an attendee with
 * a 422 rather than ignoring it.
 *
 * The password is passed in rather than read from the form: the page holds it
 * in state to score its strength and to compare it with the confirmation.
 */
export interface SignUpInput {
  name: string
  email: string
  password: string
  organizationName?: string
  persona: Persona
  acceptTerms: boolean
}

export function signUpInputOf(
  form: FormData,
  persona: Persona,
  password: string,
): SignUpInput {
  return {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    password,
    persona,
    ...workspaceOf(form, persona),
    // An unticked box is absent from the form data entirely. Passed through
    // rather than hard-coded: asserting somebody's consent on their behalf is
    // not this app's to make, and the API is what refuses when it is missing.
    acceptTerms: form.get('acceptTerms') === 'on',
  }
}

/**
 * The workspace the organizer named, or nothing at all — never an empty string.
 *
 * Absent matters: the API falls back to naming the workspace after the person
 * ("Jordan Lee's Workspace"), and a blank string would defeat that while still
 * satisfying its `@IsString()`.
 */
function workspaceOf(form: FormData, persona: Persona): { organizationName?: string } {
  if (persona === 'attendee') return {}
  const name = String(form.get('organizationName') ?? '').trim()
  return name ? { organizationName: name } : {}
}

/**
 * The form behind the emailed claim link (US-DISC-15), as
 * `POST /auth/register/from-booking/claim` wants it: the link's token, the
 * password and the terms.
 *
 * No name and no email, whatever the form holds. The address is the one the
 * link was sent to, read by the API from the token it signed, and the name is
 * the booking's — the API's whitelist refuses either from a client, and a
 * claim that could name its own address would be the takeover this link
 * exists to prevent.
 */
export interface BookingClaimInput {
  token: string
  password: string
  acceptTerms: boolean
}

export function bookingClaimInputOf(form: FormData, token: string): BookingClaimInput {
  return {
    token,
    password: String(form.get('password') ?? ''),
    // Passed through, never asserted — the same rule as `signUpInputOf`.
    acceptTerms: form.get('acceptTerms') === 'on',
  }
}
