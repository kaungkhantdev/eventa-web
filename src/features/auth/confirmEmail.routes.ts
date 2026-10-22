import { queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError, NetworkError, messageOf, meProfileApi, session, type ProfileWire } from '@/lib/api'
import type { Persona } from '@/lib/persona'
import { homeFor } from './personas'
import { INCOMPLETE_CONFIRM_LINK, TOKEN_PARAM } from '@/lib/constants/auth.constants'

/**
 * Opening the link an email change sends to the NEW address (US-SET-01,
 * US-DISC-11). The API builds it as `${PUBLIC_WEB_URL}/confirm-email?token=…`.
 *
 * Public, like `/verify-email`: the token in the link is the whole authority,
 * and the confirmation happens in the loader because opening the link is what
 * the person asked for. Until it succeeds, the old address goes on working.
 */

export type ConfirmEmailData =
  | {
      ok: true
      /** The address the account now signs in with. */
      email: string
      /** Back to the signed-in area of whoever is signed in here; `null` if nobody is. */
      next: string | null
    }
  | { ok: false; error: string }

export async function loadEmailConfirmation(
  request: Request,
  confirm: (token: string) => Promise<ProfileWire>,
  persona: Persona | null,
): Promise<ConfirmEmailData> {
  const token = queryOf(request).get(TOKEN_PARAM)?.trim()
  if (!token) return { ok: false, error: INCOMPLETE_CONFIRM_LINK }
  try {
    const { email } = await confirm(token)
    return { ok: true, email, next: persona ? homeFor(persona) : null }
  } catch (cause) {
    // An expired or already-used link is ordinary: the API's own sentence,
    // on this page, rather than the error boundary.
    if (cause instanceof ApiError || cause instanceof NetworkError) {
      return { ok: false, error: messageOf(cause) }
    }
    throw cause
  }
}

export const confirmEmailRoute = {
  loader: ({ request }: LoaderArgs): Promise<ConfirmEmailData> =>
    loadEmailConfirmation(request, meProfileApi.confirmEmail, session.persona()),
}
