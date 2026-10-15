import { signInPathFor } from '@/features/auth/personas'
import type { ClaimRefusal, PortalRegisterData, RegisterScreen } from './portalRegister.types'

/** Where a refused link sends somebody, since the page cannot know their booking. */
export const ASK_FOR_A_NEW_LINK =
  'Ask for a new link from your booking confirmation — or, if you have already chosen a password, sign in.'

/**
 * Which screen `/portal/register` shows (US-DISC-15), from what the loader
 * found and what the last claim said.
 *
 * Opened from a usable link, the name and email are the booking's and are
 * shown fixed — the address is the one the link was sent to, which is the
 * proof — and only a password is asked for. Once the address has an account
 * the link only offers to sign in: that is what makes it single-use, and how
 * "an email that already has an account" is never offered a duplicate.
 */
export function registerScreenOf(
  data: PortalRegisterData,
  result?: ClaimRefusal,
): RegisterScreen {
  const signInTo = signInPathFor('attendee')
  if (data.mode === 'direct') return { kind: 'direct' }
  if (data.mode === 'claim-invalid') {
    return { kind: 'invalid', error: data.error, advice: ASK_FOR_A_NEW_LINK, signInTo }
  }
  const { name, email, accountExists } = data.claim
  if (accountExists) {
    return {
      kind: 'exists',
      message: `An account already uses ${email}. Sign in to see every booking in one place.`,
      signInTo,
    }
  }
  return { kind: 'claim', name, email, error: result?.error ?? null }
}
