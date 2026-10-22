/**
 * The address a sign-up hands to its "check your email" page, so the page can
 * say where the confirmation link went.
 *
 * Nothing is handed INTO sign-up any more. The guest order page used to carry
 * the buyer's name and email to the attendee form; a booking's account is now
 * made from a link emailed to the booking's address (US-DISC-15), because
 * reaching the order page proves nothing about whose inbox that is.
 *
 * Carried in the router's history state, never the query string: an address
 * is personal data, and a URL is copied into logs, bookmarks and `Referer`
 * headers. State travels with the navigation and appears in none of them.
 *
 * Treated as untrusted all the same. Anything can push anything onto history
 * state and it survives a reload, so a field that is not a string is dropped
 * rather than rendered — stringifying an object onto the page is how
 * "[object Object]" ends up where somebody's address should be.
 */
export interface SignupHandoff {
  email: string
}

const EMPTY: SignupHandoff = { email: '' }

export function handoffOf(state: unknown): SignupHandoff {
  if (typeof state !== 'object' || state === null) return EMPTY
  const carried = state as Record<string, unknown>
  return { email: textOf(carried.email) }
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
