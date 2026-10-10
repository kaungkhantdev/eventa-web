import { ApiError, NetworkError, messageOf } from '@/lib/api'
import { authApi } from './api'

/** What the page shows after a submission. */
export type AcceptInviteResult =
  | { ok: true; email: string }
  | { ok: false; error: string }

const INCOMPLETE_LINK =
  'This invitation link is incomplete. Open the link from your email again, or ask an admin to re-send it.'

const PASSWORDS_DIFFER = 'Those passwords do not match.'

/** The token the emailed link carries, or null when it is not there. */
export function tokenOf(request: Request): string | null {
  return new URL(request.url).searchParams.get('token')
}

/**
 * Accept the invitation (US-SET-11).
 *
 * The confirmation is compared here and only here: it is a typo guard, not a
 * security rule, and the API is never sent the secret twice. The real rules —
 * length, composition and whether the token is still good — are the API's,
 * and its refusal comes back to sit beside the form.
 */
export async function submitAcceptInvite(
  request: Request,
  accept = authApi.acceptInvite,
): Promise<AcceptInviteResult> {
  const token = tokenOf(request)
  if (!token) return { ok: false, error: INCOMPLETE_LINK }

  const form = await request.formData()
  const password = String(form.get('password') ?? '')
  if (password !== String(form.get('confirmPassword') ?? '')) {
    return { ok: false, error: PASSWORDS_DIFFER }
  }

  try {
    const accepted = await accept(token, password)
    return { ok: true, email: accepted.email }
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) {
      return { ok: false, error: messageOf(cause) }
    }
    throw cause
  }
}

export const acceptInviteRoute = {
  /**
   * Nothing to fetch. The password reset checks its link before showing the
   * form, because `POST /auth/reset-password/check` exists; there is no
   * equivalent for an invitation, so the token is only ever spent by the
   * action and its refusal lands beside the form.
   */
  loader: () => null,
  action: ({ request }: { request: Request }) => submitAcceptInvite(request),
}
