import { api } from '@/lib/api'
import type {
  DeleteAccountBody,
  DeletionWarningWire,
  LoginSessionWire,
  RecoveryCodesWire,
  TwoFactorStartWire,
  TwoFactorWire,
} from './security.types'

/**
 * Every call the Settings tab's Security card and danger zone make, and
 * nothing else (US-DISC-12 criteria 4–5, US-DISC-14).
 *
 * Separate from `accountSettings.api.ts` because these are a different set of
 * endpoints with a different rule attached: each one carries a secret in one
 * direction or the other, and none of their answers may be stored. The only
 * thing kept anywhere is what the loader re-reads — status, a device count, a
 * forfeit — never a seed, a code or a password.
 */
export const securityApi = {
  /**
   * Criterion 4. The API verifies the current password, refuses a reuse, and
   * signs this user's OTHER devices out while keeping the one asking — so a
   * change is also the sign-out criterion 4 asks for.
   */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),

  /** Only the count is used; the portal draws no device list. */
  sessions: () => api.get<LoginSessionWire[]>('/me/sessions'),

  /**
   * Everything but this device. The current session is deliberately kept —
   * the API's own rule, so the page doing the asking survives it. The count it
   * answers with is not used: the loader re-reads the sessions either way.
   */
  revokeOtherSessions: () => api.post<{ revoked: number }>('/me/sessions/revoke-others'),

  twoFactor: () => api.get<TwoFactorWire>('/me/two-factor'),

  /**
   * Mint a seed and the `otpauth://` URI the QR encodes.
   *
   * The seed exists only in this response. It is rendered, and it is gone when
   * the panel closes — never stored, never logged, never in a URL. Calling it
   * again while an enrolment is pending mints a fresh one, which is why an
   * abandoned setup is simply restarted rather than resumed.
   */
  startTwoFactor: () => api.post<TwoFactorStartWire>('/me/two-factor/start'),

  /**
   * Prove the authenticator, and receive the recovery codes (criterion 5).
   *
   * The codes come back exactly once — the API stores only their hashes — so
   * this answer is the single moment they can be given to the reader.
   */
  confirmTwoFactor: (code: string) =>
    api.post<RecoveryCodesWire>('/me/two-factor/confirm', { code }),

  /** One call, but it still wants a current code before it will turn off. */
  disableTwoFactor: (code: string) => api.post<void>('/me/two-factor/disable', { code }),

  /** The preflight: what deleting right now walks away from (US-DISC-14). */
  deletionWarning: () => api.get<DeletionWarningWire>('/me/account/deletion'),

  /**
   * The phrase, the password, and the code when 2FA is enrolled.
   *
   * A body on a DELETE, which is what `DeleteAccountDto` takes — never a query
   * string: a password in a URL would be in history, logs and the referrer.
   */
  deleteAccount: (body: DeleteAccountBody) =>
    api.delete<{ message: string }>('/me/account', { body }),
}
