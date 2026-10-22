import { ApiError } from './ApiError'

/**
 * Run an auxiliary read, treating "you may not" as "you get no options".
 *
 * For the reads a page makes BESIDE its subject — the events a filter offers,
 * the tiers a panel books against — where the route the page itself needs is
 * open to the caller but the auxiliary one is not. A member can work the
 * registrations queue and the registrations report with `regView` alone, while
 * `GET /events` needs `evCreate` or `regCheckin`: that 403 costs them the
 * dropdown, and must not take the page down with it. Anything else — a 500, an expired session, the network — is a real
 * failure and still propagates to the route's error element.
 */
export function withoutForbidden<T>(load: () => Promise<T[]>): Promise<T[]> {
  return whenForbidden(load, [] as T[])
}

/**
 * The same rule, with the caller's own stand-in for "you may not" — `null` for
 * a panel that should be hidden rather than shown empty.
 */
export async function whenForbidden<T, F>(load: () => Promise<T>, fallback: F): Promise<T | F> {
  try {
    return await load()
  } catch (cause) {
    if (cause instanceof ApiError && cause.isForbidden) return fallback
    throw cause
  }
}
