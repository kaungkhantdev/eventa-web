import { api } from './client'

/**
 * The signed-in person's own sessions, second factor and notification
 * preferences — all `/me/*`, and all read by BOTH personas.
 *
 * Here rather than in a feature because the organizer console and the
 * attendee portal each offer account settings over the very same routes, and
 * each had written its own client and its own wire types for them. That is
 * one endpoint described in two places, and both costs had already been paid:
 *
 * - `otpauthUri` was declared `otpauthUrl` on the console side, so the field
 *   read `undefined` and the enrolment QR had nothing to encode.
 * - `LoginSessionWire.ipAddress` is `string | null` on the API
 *   (`SessionResponseDto`, over a nullable `inet()` column). The portal had
 *   it right and the console had `string`, so a session with no recorded
 *   address was typed as though it always had one.
 *
 * Each feature keeps its own view models and its own mappers; what is shared
 * is only what the wire actually is.
 */

/* ------------------------------- sessions -------------------------------- */

/** `GET /me/sessions` — `SessionResponseDto`. */
export interface LoginSessionWire {
  id: string
  device: string
  /** Null when none was recorded — not every sign-in has one. */
  ipAddress: string | null
  signedInAt: string
  expiresAt: string
  /** The device making this request. */
  isCurrent: boolean
}

/* ------------------------------ two-factor ------------------------------- */

/** `GET /me/two-factor` — the service's `TwoFactorStatus`. */
export interface TwoFactorWire {
  enabled: boolean
  /** Started and never confirmed: a seed exists, no code ever proved it. */
  pending: boolean
  recoveryCodesRemaining: number
}

/** `POST /me/two-factor/start` — `TwoFactorStartDto`. */
export interface TwoFactorStartWire {
  /** `otpauth://…` — what the QR encodes, and the only place the seed is. */
  otpauthUri: string
  /** The same seed, for an app that cannot scan. */
  secret: string
}

/**
 * `POST /me/two-factor/confirm` — `RecoveryCodesDto`.
 *
 * Shown exactly once. The API stores only their hashes, so the response is
 * the single moment these exist anywhere the reader can see them; a caller
 * that discards it has locked that person out of their own account the first
 * time they lose their authenticator.
 */
export interface RecoveryCodesWire {
  recoveryCodes: string[]
}

/* ---------------------------- notifications ------------------------------ */

/**
 * `GET /me/notification-preferences` — the service's `PreferenceView`.
 *
 * Generic in its category because the two personas genuinely differ: an
 * attendee is offered a different set of topics from an organizer. The shape
 * around it is the same, and that is the part worth sharing.
 */
export interface NotificationPreferenceWire<Category extends string = string> {
  category: Category
  emailEnabled: boolean
  smsEnabled: boolean
  /** False where the product cannot text for this category at all. */
  smsAvailable: boolean
}

/** `PATCH /me/notification-preferences/:category` — `SetPreferenceDto`. */
export interface NotificationPreferencePatch {
  emailEnabled?: boolean
  smsEnabled?: boolean
}

export const meAccountApi = {
  sessions: () => api.get<LoginSessionWire[]>('/me/sessions'),
  revokeSession: (id: string) => api.delete<void>(`/me/sessions/${id}`),

  /**
   * Everything but this device. The current session is deliberately kept —
   * the API's own rule — so the page doing the asking survives it.
   */
  revokeOtherSessions: () => api.post<{ revoked: number }>('/me/sessions/revoke-others'),

  twoFactor: () => api.get<TwoFactorWire>('/me/two-factor'),

  /**
   * Mint a seed and the `otpauth://` URI the QR encodes.
   *
   * The seed exists only in this response — rendered, then gone when the
   * panel closes. Never stored, never logged, never in a URL. Calling it
   * again while an enrolment is pending mints a fresh one.
   */
  startTwoFactor: () => api.post<TwoFactorStartWire>('/me/two-factor/start'),

  /** Prove the authenticator, and receive the recovery codes — once. */
  confirmTwoFactor: (code: string) =>
    api.post<RecoveryCodesWire>('/me/two-factor/confirm', { code }),

  /** One call, but it still wants a current code before it will turn off. */
  disableTwoFactor: (code: string) => api.post<void>('/me/two-factor/disable', { code }),

  notifications: <Category extends string = string>() =>
    api.get<NotificationPreferenceWire<Category>[]>('/me/notification-preferences'),

  setNotification: (category: string, body: NotificationPreferencePatch) =>
    api.patch<unknown>(`/me/notification-preferences/${category}`, body),
}
