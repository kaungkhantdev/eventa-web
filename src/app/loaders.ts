import { redirect } from 'react-router'
import { ApiError, session } from '@/lib/api'
import { authApi } from '@/features/auth/api'
import type { Me } from '@/features/auth/types'

/**
 * The seam between the router and the API.
 *
 * `routes.tsx` used to give every page a fixed delay so the skeletons were
 * visible against in-memory data. That stand-in is gone: a page now declares
 * what it needs, the loader fetches it, and React Router keeps
 * `navigation.state === 'loading'` for exactly as long as the request takes —
 * which is what the layouts already watch to swap in a skeleton. The loading
 * behaviour did not have to change; only what it is waiting for.
 */

/** A page that reads nothing — the loader exists only to gate on the session. */
export const guardedLoader = async () => {
  requireSession()
  return null
}

/**
 * The admin shell's loader: gate on the session, then load who is signed in.
 *
 * Fetched once here rather than per page, because the chrome needs it on every
 * screen and the permissions decide what the console offers. `useRouteLoaderData
 * (ADMIN_ROUTE_ID)` reads it anywhere below the shell without a context or a
 * store — the router already holds it, and it revalidates on navigation.
 */
export const adminShellLoader = async (): Promise<{ me: Me }> => {
  requireSession()
  try {
    return { me: await authApi.me() }
  } catch (cause) {
    // The token was present but the API rejected it and the refresh could not
    // save it — end the session rather than looping the shell against a 401.
    if (cause instanceof ApiError && cause.isUnauthorized) {
      session.end()
      throw signIn()
    }
    throw cause
  }
}

/** Route id the shell is registered under, so descendants can read its data. */
export const ADMIN_ROUTE_ID = 'admin'

/**
 * Build a loader that fetches a page's data behind the session guard.
 *
 *   loader: pageData(({ request }) => registrationsApi.list(queryOf(request)))
 *
 * A rejected promise propagates to the route's `errorElement`, so a page never
 * renders against half-loaded data and never has to write an error branch.
 */
export function pageData<T>(load: (args: LoaderArgs) => Promise<T>) {
  return async (args: LoaderArgs): Promise<T> => {
    requireSession()
    try {
      return await load(args)
    } catch (cause) {
      // An expired session that survived the check above — the token was
      // present but the API refused it, and the refresh could not save it.
      if (cause instanceof ApiError && cause.isUnauthorized) throw signIn()
      throw cause
    }
  }
}

export interface LoaderArgs {
  request: Request
  params: Record<string, string | undefined>
}

/** Refuse before fetching: an unauthenticated call would only 401 anyway. */
function requireSession() {
  if (!session.isSignedIn()) throw signIn()
}

/**
 * Send them to sign in, remembering where they were headed so the login can
 * return them there rather than dumping everyone on the dashboard.
 */
function signIn(): Response {
  const from = window.location.pathname + window.location.search
  const to = from && from !== '/' ? `?from=${encodeURIComponent(from)}` : ''
  return redirect(`/auth/login${to}`)
}

/** Read the paging and filter parameters a list page was asked for. */
export function queryOf(request: Request): URLSearchParams {
  return new URL(request.url).searchParams
}
