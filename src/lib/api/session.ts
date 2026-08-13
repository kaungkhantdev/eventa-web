/**
 * Where the signed-in organizer's tokens live.
 *
 * `localStorage`, because the API returns the access and refresh tokens in the
 * response body rather than setting an httpOnly cookie — so the browser has to
 * hold them somewhere reachable from JS, and the choice is only between
 * storages an XSS could read anyway. It is a real tradeoff, recorded here
 * rather than hidden: if the API ever moves to cookie auth, this module is the
 * one place that changes.
 *
 * Reads are wrapped because Safari's private mode throws on `localStorage`
 * access, and a storage failure should sign someone out — not crash the app.
 */

const ACCESS_KEY = 'eventa.accessToken'
const REFRESH_KEY = 'eventa.refreshToken'

export interface Tokens {
  accessToken: string
  refreshToken: string
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

  start(tokens: Tokens): void {
    write(ACCESS_KEY, tokens.accessToken)
    write(REFRESH_KEY, tokens.refreshToken)
    announce()
  },

  /** Replace just the access token after a refresh; the refresh token stands. */
  renew(accessToken: string, refreshToken?: string): void {
    write(ACCESS_KEY, accessToken)
    if (refreshToken) write(REFRESH_KEY, refreshToken)
    announce()
  },

  end(): void {
    remove(ACCESS_KEY)
    remove(REFRESH_KEY)
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
