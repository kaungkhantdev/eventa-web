import type { ShouldRevalidateFunctionArgs } from 'react-router'
import { queryOf, type LoaderArgs } from '@/app/loaders'
import { ApiError, NetworkError, messageOf } from '@/lib/api'
import { authApi, type ResetLinkCheck } from './api'
import { toResetLinkView, type ResetLinkView } from './resetPassword.mapper'

/**
 * Opening the reset link from a forgot-password email (US-ACC-04).
 *
 * Public: the person cannot sign in — that is why they are here — and the token
 * in the link is the whole authorisation. It is read from the URL it arrived in
 * and sent only in request bodies; nothing here logs or stores it.
 *
 * The loader CHECKS the link without spending it, so an expired or used one is
 * refused when it is opened (criterion 7) instead of after a new password has
 * been typed twice. The action spends it.
 */

export type ResetLinkData =
  | { state: 'ready'; view: ResetLinkView }
  | { state: 'invalid'; error: string }

/**
 * `recheck` says whether the refusal could be about the link, and so whether
 * the page should check the link again (see `shouldRecheckLink`).
 */
export type ResetResult =
  | { ok: true; message: string }
  | { ok: false; error: string; recheck: boolean }

/** Which of the page's three screens to show. */
export type ResetScreen =
  | { kind: 'ready'; view: ResetLinkView; error: string | null }
  | { kind: 'done'; view: ResetLinkView; message: string }
  | { kind: 'invalid'; error: string }

/** Fixed by the link the API emails: `${PUBLIC_WEB_URL}/reset-password?token=…`. */
const TOKEN_PARAM = 'token'

export const INCOMPLETE_LINK =
  'This reset link is incomplete. Open the most recent link in your email, or request a new one.'

/** The same words the sign-up form uses for the same typo. */
export const PASSWORDS_DIFFER = 'Those passwords do not match.'

type CheckLink = (token: string) => Promise<ResetLinkCheck>
type ResetPassword = (token: string, newPassword: string) => Promise<{ message: string }>

function tokenOf(request: Request): string | null {
  return queryOf(request).get(TOKEN_PARAM)?.trim() || null
}

export async function loadResetLink(request: Request, check: CheckLink): Promise<ResetLinkData> {
  const token = tokenOf(request)
  if (!token) return { state: 'invalid', error: INCOMPLETE_LINK }
  try {
    return { state: 'ready', view: toResetLinkView(await check(token)) }
  } catch (cause) {
    // The token is all the check is asked about, so any validation refusal is
    // a refusal of the link — and its message is written for the person
    // holding it. Anything else (an outage) says nothing about the link and
    // goes to the error screen, which offers a retry rather than a new link.
    if (cause instanceof ApiError && cause.isValidation) {
      return { state: 'invalid', error: messageOf(cause) }
    }
    throw cause
  }
}

/**
 * Set the new password. The confirmation is compared here and only here: it is
 * a typo guard, not a security rule, and the API is never sent the secret
 * twice. The real rules — length, composition, "not your current password",
 * and whether the link is still good — are the API's, and its refusal comes
 * back to sit beside the form.
 */
export async function submitNewPassword(
  request: Request,
  reset: ResetPassword,
): Promise<ResetResult> {
  const token = tokenOf(request)
  if (!token) return { ok: false, error: INCOMPLETE_LINK, recheck: false }
  const form = await request.formData()
  const newPassword = String(form.get('newPassword') ?? '')
  if (newPassword !== String(form.get('confirmPassword') ?? '')) {
    return { ok: false, error: PASSWORDS_DIFFER, recheck: false }
  }
  try {
    return { ok: true, message: (await reset(token, newPassword)).message }
  } catch (cause) {
    if (cause instanceof ApiError || cause instanceof NetworkError) {
      return { ok: false, error: messageOf(cause), recheck: mayBeAboutTheLink(cause) }
    }
    throw cause
  }
}

/**
 * Only a validation refusal can mean the link has gone bad. An outage or a
 * server failure says nothing about it — and the re-check would fail the same
 * way, sending the page to its error screen and losing what was typed.
 */
function mayBeAboutTheLink(cause: ApiError | NetworkError): boolean {
  return cause instanceof ApiError && cause.isValidation
}

/**
 * The router re-runs the loader after every submission; this decides whether
 * the link is checked again.
 *
 * Not after a reset that worked: the link is spent, the check would report,
 * correctly, that it has been used, and "done" would become "that link didn't
 * work". After a refusal, only when the refusal could be about the link (it
 * may have expired meanwhile, and re-checking is what shows that) — never
 * after an outage, whose re-check would fail too and replace the form with
 * the error screen. Anything that is not a submission is the router's call.
 */
export function shouldRecheckLink({
  actionResult,
  defaultShouldRevalidate,
}: Pick<ShouldRevalidateFunctionArgs, 'actionResult' | 'defaultShouldRevalidate'>): boolean {
  if (!isResetResult(actionResult)) return defaultShouldRevalidate
  return !actionResult.ok && actionResult.recheck
}

/** The link as the loader found it, and what the last submission said. */
export function screenOf(link: ResetLinkData, result: ResetResult | undefined): ResetScreen {
  if (link.state === 'invalid') return { kind: 'invalid', error: link.error }
  if (result?.ok) return { kind: 'done', view: link.view, message: result.message }
  return { kind: 'ready', view: link.view, error: result?.error ?? null }
}

function isResetResult(result: unknown): result is ResetResult {
  return typeof result === 'object' && result !== null && 'ok' in result
}

export const resetPasswordRoute = {
  loader: ({ request }: LoaderArgs) =>
    loadResetLink(request, (token) => authApi.checkResetLink(token)),
  action: ({ request }: LoaderArgs) =>
    submitNewPassword(request, (token, newPassword) => authApi.resetPassword(token, newPassword)),
  shouldRevalidate: shouldRecheckLink,
}
