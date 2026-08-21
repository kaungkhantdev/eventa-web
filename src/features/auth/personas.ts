import { isPersona, type Persona } from '@/lib/persona'

/**
 * Where each audience signs in and where it lands.
 *
 * Lookup tables rather than `if (persona === 'admin')` scattered through the
 * app: the two personas never share a login, and a third audience — should one
 * ever exist — should be one line here rather than a hunt for branches.
 */

const SIGN_IN_PATH: Record<Persona, string> = {
  admin: '/auth/login',
  attendee: '/portal/login',
}

/**
 * Where each audience opens an account. The portal's "Create an event" reaches
 * for the organizer's: an attendee account is the wrong thing entirely, and
 * signing one up would strand a would-be organizer outside /admin holding
 * credentials that look correct.
 */
const SIGN_UP_PATH: Record<Persona, string> = {
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
const HOME_PATH: Record<Persona, string> = {
  admin: '/admin/home',
  attendee: '/portal/my-events',
}

/**
 * Where sign-up ends. Not a banner over the form: the account already exists,
 * nothing on that form can usefully be edited any more, and the only thing left
 * to do happens in an email client.
 */
const CHECK_EMAIL_PATH: Record<Persona, string> = {
  admin: '/auth/register/check-email',
  attendee: '/portal/register/check-email',
}

export function signInPathFor(persona: Persona): string {
  return SIGN_IN_PATH[persona]
}

export function signUpPathFor(persona: Persona): string {
  return SIGN_UP_PATH[persona]
}

export function homeFor(persona: Persona): string {
  return HOME_PATH[persona]
}

export function checkEmailPathFor(persona: Persona): string {
  return CHECK_EMAIL_PATH[persona]
}

/**
 * Which audience a shared page is serving, from `?persona=`.
 *
 * Forgot-password is one screen for both, and the API needs to be told which
 * realm to look in. Anything unrecognised is the organizer — the address bar is
 * not a trusted input.
 */
export function personaOfSearch(params: URLSearchParams): Persona {
  const asked = params.get('persona')
  return isPersona(asked) ? asked : 'admin'
}

/**
 * The persona a completed sign-in belongs to, read from the API's own answer.
 *
 * Never from the form: the form is what the caller asked for, and labelling a
 * session with it would let a page mislabel its own token. `undefined` is the
 * two-factor branch — the password was right, but no session exists yet.
 */
export function personaOfSession(user: { persona: string } | undefined): Persona | null {
  return user && isPersona(user.persona) ? user.persona : null
}
