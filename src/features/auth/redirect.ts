import { PERSONAS } from '@/lib/persona'
import { signInPathFor, signUpPathFor } from './personas'

/**
 * What the guard remembers as "where they were headed", for `?from=`.
 *
 * A guest screen redirects a visitor who already has a session, which means it
 * can now be the page somebody is stopped on — and remembering it would return
 * them to the sign-in form the instant they signed in. `guestOnly` would move
 * them along, so it resolves itself, but by way of a nonsense URL and a hop
 * nobody asked for.
 *
 * The screens are derived from the persona tables rather than listed again
 * here: a third audience gets this for free, and a renamed path cannot leave a
 * stale copy behind.
 */
export function returnTo(pathname: string, search: string): string | null {
  if (pathname === '/' || isGuestScreen(pathname)) return null
  return `${pathname}${search}`
}

function isGuestScreen(pathname: string): boolean {
  return PERSONAS.some(
    (persona) =>
      isSelfOrBelow(pathname, signInPathFor(persona)) ||
      isSelfOrBelow(pathname, signUpPathFor(persona)),
  )
}

/** `/auth/register` and its `/check-email` follow-on; never `/portal/logins`. */
function isSelfOrBelow(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

/**
 * Where to send someone after they sign in.
 *
 * The guard remembers where they were headed in `?from=`, which means the
 * destination is attacker-supplied: a link to `/auth/login?from=//evil.example`
 * would otherwise bounce them off the site with their session freshly created.
 * Only a path rooted at this site is honoured.
 */
export function safeRedirect(from: string | null, fallback: string): string {
  return isSameSitePath(from) ? from : fallback
}

function isSameSitePath(from: string | null): from is string {
  if (!from || !from.startsWith('/')) return false
  // `//evil.example` is a protocol-relative URL, and browsers normalise the
  // backslash form `/\evil.example` to the same thing — so both leave the site
  // despite starting with a slash.
  return from[1] !== '/' && from[1] !== '\\'
}
