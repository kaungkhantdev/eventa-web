import { redirect } from 'react-router'
import { session } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { homeFor } from './personas'

/**
 * Keeping a signed-in visitor off the sign-in and sign-up screens (US-ACC-01).
 *
 * Those pages are for people who have no session, and reaching one with a
 * session is a dead end that only offers ways to damage it: signing in again
 * replaces a perfectly good token, and "create an account" from inside a
 * workspace opens a second one nobody asked for.
 */

/**
 * Where an already-signed-in visitor to a guest page belongs — or `null` when
 * the page is theirs to see.
 *
 * Not a plain "is signed in" check, and that is the whole rule: there is one
 * session slot, labelled with the persona that owns it, and the two audiences
 * never share a login. Somebody holding an attendee session who opens the
 * organizer sign-in is switching, not lost, so only a matching persona is sent
 * home.
 */
export function homeForSignedIn(
  pagePersona: Persona,
  signedInAs: Persona | null,
): string | null {
  return signedInAs === pagePersona ? homeFor(pagePersona) : null
}

/**
 * The loader for a sign-in or sign-up route.
 *
 * Reads the stored label rather than asking the API: this decides which of two
 * screens to render, not what anybody may do, and a network round trip in front
 * of the sign-in form would delay the one page that has to be fast. A stale
 * label costs a redirect to a guarded page, which sends them straight back.
 */
export function guestOnly(pagePersona: Persona) {
  return async (): Promise<null> => {
    const home = homeForSignedIn(pagePersona, session.persona())
    if (home) throw redirect(home)
    return null
  }
}
