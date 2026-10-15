import { ApiError } from './ApiError'

/**
 * Run an auxiliary read, treating "you may not" as "you get no options".
 *
 * For the reads a page makes BESIDE its subject — the events a filter offers,
 * the tiers a panel books against — where the route the page itself needs is
 * open to the caller but the auxiliary one is not. Staff work the registrations
 * queue and the registrations report with `regView`, while `GET /events` needs
 * `evCreate`: that 403 costs them the dropdown, and must not take the page down
 * with it. Anything else — a 500, an expired session, the network — is a real
 * failure and still propagates to the route's error element.
 */
export async function withoutForbidden<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load()
  } catch (cause) {
    if (cause instanceof ApiError && cause.isForbidden) return []
    throw cause
  }
}
