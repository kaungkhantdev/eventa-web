import { redirect } from 'react-router'
import { ApiError, NetworkError, messageOf, session } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { authApi } from '@/features/auth/api'
import { signInPathFor } from '@/features/auth/personas'
import { returnTo } from '@/features/auth/redirect'
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
  requirePersona('admin')
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
export const adminShellLoader = () => shellLoader('admin')

/**
 * The attendee portal's guard, for the one route that needs a session.
 *
 * Browsing and registering for an event never require an account, so this is
 * deliberately not applied to the rest of `/portal/*`.
 */
export const attendeeLoader = () => shellLoader('attendee')

/**
 * Gate on the session, then load who is signed in — and check the API agrees.
 *
 * The stored label only tidies the UI; `me.persona` is the answer that counts,
 * because the label is written by this app and the token is validated by the
 * server. If they disagree, the storage is wrong: end it rather than render a
 * console for someone the API will refuse on every subsequent request.
 */
async function shellLoader(persona: Persona): Promise<{ me: Me }> {
  requirePersona(persona)
  try {
    const me = await authApi.me()
    if (me.persona !== persona) {
      session.end()
      throw signIn(persona)
    }
    return { me }
  } catch (cause) {
    // The token was present but the API rejected it and the refresh could not
    // save it — end the session rather than looping the shell against a 401.
    if (cause instanceof ApiError && cause.isUnauthorized) {
      session.end()
      throw signIn(persona)
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
  return guardedData('admin', load)
}

/**
 * The same, for a page the attendee portal owns.
 *
 * Separate from `pageData` so the persona is stated at the route rather than
 * inferred: an attendee sent to the organizer's sign-in would be asked for a
 * workspace they do not have.
 */
export function attendeeData<T>(load: (args: LoaderArgs) => Promise<T>) {
  return guardedData('attendee', load)
}

function guardedData<T>(persona: Persona, load: (args: LoaderArgs) => Promise<T>) {
  return async (args: LoaderArgs): Promise<T> => {
    requirePersona(persona)
    try {
      return await load(args)
    } catch (cause) {
      // An expired session that survived the check above — the token was
      // present but the API refused it, and the refresh could not save it.
      if (cause instanceof ApiError && cause.isUnauthorized) throw signIn(persona)
      throw cause
    }
  }
}

/**
 * Build an action that mutates behind the session guard.
 *
 * A refusal comes back as a message instead of an exception, because unlike a
 * failed load it must be shown *beside the control the person used* — a 409
 * "cancel it instead to refund attendees" is the product answering them, and
 * throwing it would replace the whole screen with an error page. Anything that
 * is not the API talking (a bug, a thrown redirect) still propagates.
 */
export function pageAction(run: (args: LoaderArgs) => Promise<unknown>) {
  return guardedAction('admin', run)
}

/**
 * The same, for a mutation the attendee portal owns — answering a survey, say.
 *
 * Separate from `pageAction` only in which sign-in an expired session is sent
 * to. An attendee bounced to the organizer's login would be asked for a
 * workspace they have no business having.
 */
export function attendeeAction(run: (args: LoaderArgs) => Promise<unknown>) {
  return guardedAction('attendee', run)
}

/**
 * What an action reports when the work succeeded.
 *
 * Normally just `ok`: this app's rule is that the API is the source of truth
 * and a mutation is followed by revalidation, so an action that returned server
 * data would be inviting a second copy of it.
 *
 * The exception is an answer no later read can reproduce.
 * `POST /me/two-factor/start` replies with a one-time secret and its otpauth
 * URI, and `/confirm` replies with the recovery codes — and no GET exposes
 * either again, by design. There is nothing to revalidate; the answer existed
 * once, in that response.
 *
 * It used to be dropped. `guardedAction` returned a bare `{ ok: true }`, so the
 * console's enrolment screen read `act.data.secret` as `undefined` on every
 * render, no QR was ever drawn, and the recovery codes were thrown away — which
 * left US-ACC-07's two-factor setup non-functional in shipped code while every
 * test stayed green.
 *
 * Only a plain object of named fields is carried, and it cannot claim the
 * action failed: an API answering with a field called `ok` must not invert the
 * outcome every caller branches on.
 */
export function actionSuccess(payload: unknown): ActionResult {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return { ok: true }
  }
  // `ok` last so a payload cannot claim the action failed, and `error`
  // dropped so a success cannot arrive carrying a refusal sentence.
  const named = { ...(payload as Record<string, unknown>) }
  delete named.error
  return { ...named, ok: true }
}

function guardedAction(
  persona: Persona,
  run: (args: LoaderArgs) => Promise<unknown>,
) {
  return async (args: LoaderArgs): Promise<ActionResult | Response> => {
    requirePersona(persona)
    try {
      const result = await run(args)
      // An action that answers with a Response is redirecting — creating a
      // draft moves the wizard to `?id=`. Swallowing it would leave the person
      // on a URL that no longer describes what they are editing.
      if (result instanceof Response) return result
      return actionSuccess(result)
    } catch (cause) {
      if (cause instanceof ApiError && cause.isUnauthorized) throw signIn(persona)
      if (cause instanceof ApiError || cause instanceof NetworkError) {
        return {
          ok: false,
          error: messageOf(cause),
          // Which input each refusal is about, when the API said. Pages put
          // these under the field rather than at the foot of the form.
          ...(cause instanceof ApiError && cause.fieldErrors.length > 0
            ? { fieldErrors: cause.byField() }
            : {}),
        }
      }
      throw cause
    }
  }
}

/** What every mutation reports back: it worked, or why the API said no. */
export interface ActionResult {
  ok: boolean
  /** The API's own sentence, shown verbatim — it was written for the reader. */
  error?: string
  /**
   * Field name → the refusal about it, when the API named one. Absent when
   * nothing is to blame in particular: a network failure and a stale version
   * belong at the foot of the form, not under an input.
   */
  fieldErrors?: Record<string, string>
  /**
   * An answer no later read can reproduce — a one-time secret, recovery codes.
   * See {@link actionSuccess} for why an action may carry data at all.
   */
  [field: string]: unknown
}

export interface LoaderArgs {
  request: Request
  params: Record<string, string | undefined>
}

/**
 * Refuse before fetching: an unauthenticated call would only 401 anyway.
 *
 * The persona has to match, not merely exist. A browser holding an attendee
 * session would otherwise pass a bare "is signed in" check, and every admin
 * request behind it would 403 — an error screen where a sign-in was meant.
 */
function requirePersona(persona: Persona) {
  if (session.persona() !== persona) throw signIn(persona)
}

/**
 * Send them to sign in — at their OWN login, remembering where they were headed
 * so it can return them there rather than dumping everyone on a dashboard.
 */
function signIn(persona: Persona): Response {
  const from = returnTo(window.location.pathname, window.location.search)
  const to = from ? `?from=${encodeURIComponent(from)}` : ''
  return redirect(`${signInPathFor(persona)}${to}`)
}

/** Read the paging and filter parameters a list page was asked for. */
export function queryOf(request: Request): URLSearchParams {
  return new URL(request.url).searchParams
}
