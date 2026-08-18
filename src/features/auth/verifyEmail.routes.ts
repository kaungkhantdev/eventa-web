import { queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError, NetworkError, messageOf } from '@/lib/api'
import { authApi, type VerifiedEmail } from './api'

/**
 * Opening the confirmation link from a sign-up email (US-ACC-01, US-DISC-08).
 *
 * Public: the person is by definition not signed in yet, and the token in the
 * link is the whole authorisation.
 *
 * The activation happens in the loader rather than on a button, because that is
 * what the person clicking the link already asked for — making them press
 * "confirm" once more confirms nothing. It is safely repeatable: activating an
 * already-active account is a no-op on the API side.
 */

export type VerifyEmailData =
  | { ok: true; verified: VerifiedEmail }
  | { ok: false; error: string }

const NO_TOKEN =
  'This confirmation link is incomplete. Open the most recent link in your email, or request a new one.'

export const TOKEN_PARAM = 'token'

export const verifyEmailRoute = {
  loader: async ({ request }: LoaderArgs): Promise<VerifyEmailData> => {
    const token = queryOf(request).get(TOKEN_PARAM)?.trim()
    if (!token) return { ok: false, error: NO_TOKEN }
    try {
      return { ok: true, verified: await authApi.verifyEmail(token) }
    } catch (cause) {
      // An expired or already-used link is an ordinary thing to happen, not a
      // crash: it gets this page's own "that didn't work" state, with the API's
      // wording, rather than the error boundary's stack trace.
      if (cause instanceof ApiError || cause instanceof NetworkError) {
        return { ok: false, error: messageOf(cause) }
      }
      throw cause
    }
  },
}
