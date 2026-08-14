import { isPersona, type Persona } from '@/lib/persona'

/**
 * Where the signed-in person's tokens live.
 *
 * `localStorage`, because the API returns the access and refresh tokens in the
 * response body rather than setting an httpOnly cookie — so the browser has to
 * hold them somewhere reachable from JS, and the choice is only between
 * storages an XSS could read anyway. It is a real tradeoff, recorded here
 * rather than hidden: if the API ever moves to cookie auth, this module is the
 * one place that changes.
 *
 * **One slot, labelled with the persona that owns it.** There is one
 * `Authorization` header per request, so a browser holds one session — and an
 * organizer who signs into the attendee portal is signed out of the console
 * here. That is deliberate: the alternative, a token per persona, would make
 * every request ask *which* token to attach, and `/auth/me`, `/auth/refresh`
 * and `/auth/logout` are shared by both — so the wrong bearer would be a silent
 * failure in the one layer that must never be ambiguous. The label lets a guard
 * ask whose session this is and send them to the right sign-in instead of
 * looping against a 401.
 *
 * Reads are wrapped because Safari's private mode throws on `localStorage`
 * access, and a storage failure should sign someone out — not crash the app.
 */

const ACCESS_KEY = 'eventa.accessToken'
const REFRESH_KEY = 'eventa.refreshToken'
const PERSONA_KEY = 'eventa.persona'

export interface Tokens {
  accessToken: string
  refreshToken: string
  /** Taken from the API's own answer, never from the sign-in form. */
  persona: Persona
}

/** Notified whenever the session starts or ends, so the app can react. */
type Listener = () => void
const listeners = new Set<Listener>()

export const session = {
  accessToken(): string | null {
    return read(ACCESS_KEY)
  },

  refreshToken(): string | null {
    return read(REFRESH_KEY)
  },

  isSignedIn(): boolean {
    return read(ACCESS_KEY) !== null
  },

  /**
   * Which audience the stored session belongs to.
   *
   * `null` when nobody is signed in — and also when the stored label is missing
   * or unrecognised, which is how a session written before personas existed
   * reads. Both mean "this is not the persona you are asking for", so a guard
   * sends them to sign in rather than trusting a token it cannot place.
   */
  persona(): Persona | null {
    const stored = read(PERSONA_KEY)
    return isPersona(stored) ? stored : null
  },

  start(tokens: Tokens): void {
    write(ACCESS_KEY, tokens.accessToken)
    write(REFRESH_KEY, tokens.refreshToken)
    write(PERSONA_KEY, tokens.persona)
    announce()
  },

  /**
   * Replace just the access token after a refresh; the refresh token stands.
   * The persona is left alone — the API copies it verbatim onto the new token,
   * so a refresh cannot change who is signed in.
   */
  renew(accessToken: string, refreshToken?: string): void {
    write(ACCESS_KEY, accessToken)
    if (refreshToken) write(REFRESH_KEY, refreshToken)
    announce()
  },

  end(): void {
    remove(ACCESS_KEY)
    remove(REFRESH_KEY)
    remove(PERSONA_KEY)
    announce()
  },

  /** Subscribe to sign-in/out. Returns the unsubscribe. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

function announce() {
  for (const listener of listeners) listener()
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* Private browsing: the session simply won't survive a reload. */
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* Nothing to clear. */
  }
}
