import type { VerifiedEmail } from './api'
import { signInPathFor } from './personas'

/** The query key `/auth/login` reads to prefill the workspace field. */
export const ORG_PARAM = 'org'

/**
 * Where a just-confirmed account signs in.
 *
 * An organizer arrives with their workspace already filled in — they have never
 * typed the slug, it was generated for them at sign-up, and asking them to
 * remember it is the fastest way to lose them at the last step.
 *
 * An attendee carries nothing. Their `orgSlug` is the platform organization's,
 * a detail of how attendees are stored rather than anything they should see or
 * send: attendee sign-in refuses an `orgSlug` with a 422 (US-DISC-08).
 */
export function signInLinkFor(verified: VerifiedEmail): string {
  const path = signInPathFor(verified.persona)
  if (verified.persona !== 'admin') return path
  return `${path}?${ORG_PARAM}=${encodeURIComponent(verified.orgSlug)}`
}
