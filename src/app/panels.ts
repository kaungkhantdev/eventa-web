import { ApiError, NetworkError, messageOf } from '@/lib/api'

/**
 * One panel's worth of data, and what to say if it never arrived.
 *
 * The overview screens gather several independent reads — today's sign-ups,
 * meetings, upcoming events, the activity ring. US-DASH-13 asks that one of
 * them failing leaves the rest working, which `Promise.all` cannot do: a single
 * rejection takes the whole loader, and the page renders as an error.
 *
 * So a *supplementary* read is wrapped here instead of awaited bare, and the
 * page renders an "unavailable · retry" state for exactly that panel. The
 * screen's own subject is never wrapped — a home page that cannot say whose it
 * is has nothing to show.
 */
export type Panel<T> = { ok: true; data: T } | { ok: false; error: string }

export async function panel<T>(request: Promise<T>): Promise<Panel<T>> {
  try {
    return { ok: true, data: await request }
  } catch (cause) {
    // Two failures are not this panel's to absorb. An expired session has to
    // reach the loader's guard, which redirects to sign-in; a bug in our own
    // code has to reach the error boundary, or "retry" becomes the product's
    // answer to a TypeError and nobody hears about it.
    if (cause instanceof ApiError && cause.isUnauthorized) throw cause
    if (!(cause instanceof ApiError) && !(cause instanceof NetworkError)) throw cause
    return { ok: false, error: messageOf(cause) }
  }
}

/**
 * Map a panel that loaded; carry an unavailable one through untouched.
 *
 * Mapping belongs at the edge like any other view model, and the alternative —
 * `p.ok ? {ok: true, data: to(p.data)} : p` at every call site — is the same
 * branch written out five times per loader.
 */
export function mapPanel<T, U>(source: Panel<T>, to: (data: T) => U): Panel<U> {
  return source.ok ? { ok: true, data: to(source.data) } : source
}
