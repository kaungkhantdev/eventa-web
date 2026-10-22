import { replace, type ShouldRevalidateFunctionArgs } from 'react-router'
import { queryOf, type LoaderArgs } from '@/app/loaders'
import { authApi, type BookingClaim } from '@/features/auth/api'
import { guestOnly } from '@/features/auth/guestOnly'
import { homeFor } from '@/features/auth/personas'
import { bookingClaimInputOf, type BookingClaimInput } from '@/features/auth/signUpInput'
import type { LoginResult } from '@/features/auth/types'
import { ApiError, NetworkError, messageOf } from '@/lib/api'
import { adoptGuestSaves } from './guestSaves'
import type { ClaimRefusal, PortalRegisterData } from './portalRegister.types'
import { CLAIM_PARAM, INCOMPLETE_CLAIM_LINK } from '@/lib/constants/portal.constants'
import { PASSWORDS_DIFFER } from '@/lib/constants/auth.constants'

/**
 * The attendee sign-up at `/portal/register`, and the one-time link emailed
 * to a booking's address when its buyer asks to keep the tickets (US-DISC-15).
 *
 * Opened directly, this is the ordinary sign-up (US-DISC-08): the loader is
 * only the guest guard, and the form's own handler submits it.
 *
 * Opened from the link, the token in it is the whole authorisation — the
 * proof that whoever is holding it reads that inbox. The loader CHECKS it
 * without spending it, so a bad link is refused when it is opened rather than
 * after a password has been typed twice; the action spends it. It is read from
 * the URL it arrived in and sent only in request bodies; nothing here logs or
 * stores it.
 */

type InspectClaim = (token: string) => Promise<BookingClaim>
type ClaimAccount = (input: BookingClaimInput) => Promise<LoginResult>

/**
 * `null` when the page was not opened from a claim link at all; an empty
 * string when it was, but the link lost its token on the way.
 */
function claimOf(request: Request): string | null {
  const params = queryOf(request)
  return params.has(CLAIM_PARAM) ? (params.get(CLAIM_PARAM) ?? '').trim() : null
}

/**
 * Which sign-up this is. The guest guard stands only in front of the ordinary
 * one: an emailed link has to work on whatever device it is opened on, signed
 * in or not — the same reason the reset link is not guest-only.
 */
export async function loadPortalRegister(
  request: Request,
  inspect: InspectClaim = authApi.inspectBookingClaim,
  guard: () => Promise<unknown> = guestOnly('attendee'),
): Promise<PortalRegisterData> {
  const token = claimOf(request)
  if (token === null) {
    await guard()
    return { mode: 'direct' }
  }
  if (!token) return { mode: 'claim-invalid', error: INCOMPLETE_CLAIM_LINK }
  try {
    return { mode: 'claim', claim: await inspect(token) }
  } catch (cause) {
    // The token is all the check is asked about, so a validation refusal is a
    // refusal of the link, worded for the person holding it. An outage says
    // nothing about the link and goes to the error screen, which offers a
    // retry rather than sending them round for a new link.
    if (cause instanceof ApiError && cause.isValidation) {
      return { mode: 'claim-invalid', error: messageOf(cause) }
    }
    throw cause
  }
}

/**
 * Choose the password and create the account the link proves, then land on My
 * Events signed in — the session begun exactly as a sign-in begins one, and a
 * guest's saved events handed over first, as `PortalLoginPage` does.
 *
 * The confirmation is compared here and only here: a typo guard, not a
 * security rule. The real rules — the password's, the terms, whether the link
 * is still good, whether the address already has an account — are the API's,
 * and its refusal comes back to sit beside the form.
 */
export async function submitBookingClaim(
  request: Request,
  claim: ClaimAccount = authApi.claimBookingAccount,
  afterSignIn: () => Promise<void> = adoptGuestSaves,
): Promise<ClaimRefusal | Response> {
  const token = claimOf(request)
  if (!token) return { ok: false, error: INCOMPLETE_CLAIM_LINK, recheck: false }
  const form = await request.formData()
  if (String(form.get('password') ?? '') !== String(form.get('confirmPassword') ?? '')) {
    return { ok: false, error: PASSWORDS_DIFFER, recheck: false }
  }
  try {
    await claim(bookingClaimInputOf(form, token))
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) {
      return { ok: false, error: messageOf(cause), recheck: mayBeAboutTheLink(cause) }
    }
    throw cause
  }
  await afterSignIn()
  // `replace`, as sign-in and sign-up navigate: Back returns to wherever they
  // came from rather than to a claim form for an account that now exists.
  return replace(homeFor('attendee'))
}

/**
 * A validation refusal may be the link going bad while the form was open, and
 * a conflict is the address having an account by now — the link already used.
 * Re-checking shows either. An outage says nothing about the link, and the
 * re-check would fail the same way, losing what was typed.
 */
function mayBeAboutTheLink(cause: ApiError | NetworkError): boolean {
  return cause instanceof ApiError && (cause.isValidation || cause.isConflict)
}

/**
 * The router re-runs the loader after every submission; this decides whether
 * the link is checked again. A claim that worked redirects, so it never asks.
 */
export function shouldRecheckClaim({
  actionResult,
  defaultShouldRevalidate,
}: Pick<ShouldRevalidateFunctionArgs, 'actionResult' | 'defaultShouldRevalidate'>): boolean {
  if (!isClaimRefusal(actionResult)) return defaultShouldRevalidate
  return actionResult.recheck
}

function isClaimRefusal(result: unknown): result is ClaimRefusal {
  return typeof result === 'object' && result !== null && 'recheck' in result
}

export const portalRegisterRoute = {
  loader: ({ request }: LoaderArgs) => loadPortalRegister(request),
  action: ({ request }: LoaderArgs) => submitBookingClaim(request),
  shouldRevalidate: shouldRecheckClaim,
}
