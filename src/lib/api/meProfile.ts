import { api } from './client'

/**
 * The signed-in person's own record — `/me/profile` (US-SET-01, US-DISC-11).
 *
 * Here rather than in a feature because BOTH personas edit it: the organizer
 * console's account screens and the attendee portal's Profile tab are the same
 * three routes on the same row, since `/me/profile` is whoever holds the token
 * whatever persona they signed in as. Each feature had its own copy of this
 * shape and its own client for these calls, which is two places for one
 * endpoint to be described — and one of them typed its patch body as
 * `Record<string, unknown>`, so a misspelled or stale field name reached the
 * API with nothing to catch it.
 *
 * Features keep their own facade over this (`profileApi`, `accountApi`) for the
 * calls that really are theirs — the portal's photo, the console's logo.
 */

/** `GET /me/profile`. */
export interface ProfileWire {
  id: string
  name: string
  /** The address you sign in with. */
  email: string
  /** A requested address awaiting confirmation; the old one still works. */
  pendingEmail: string | null
  /** False while an email change is unconfirmed. */
  emailVerified: boolean
  phone: string | null
  timezone: string | null
  locale: 'en' | 'th' | null
  avatarUrl: string | null
  city: string | null
  /** A plain calendar date, `YYYY-MM-DD` — not an instant. */
  dateOfBirth: string | null
  bio: string | null
  /** Display only — every charge still settles in THB. */
  displayCurrency: string | null
}

/**
 * The fields a member may change on their own profile — `UpdateProfileDto`.
 *
 * Every one is optional and most are nullable: omitting a key leaves it as it
 * is, and `null` clears it. `avatarUrl` is deliberately absent, as it is on the
 * API — a photo is only ever set by confirming an upload the server issued.
 */
export interface ProfilePatch {
  name?: string
  phone?: string | null
  timezone?: string | null
  locale?: 'en' | 'th' | null
  city?: string | null
  dateOfBirth?: string | null
  bio?: string | null
  displayCurrency?: string | null
}

export const meProfileApi = {
  /** The whole record, for whichever screen is rendering it. */
  profile: () => api.get<ProfileWire>('/me/profile'),

  /**
   * Save the details form. A partial patch: an omitted key is left as it is
   * and `null` clears a field, so an emptied box means "clear it" rather than
   * "send the empty string".
   */
  saveProfile: (body: ProfilePatch) => api.patch<ProfileWire>('/me/profile', body),

  /**
   * Ask to move the account to a new address. The API emails a confirmation to
   * the NEW address and the old one goes on working until that link is opened,
   * so this returns with the change merely requested, never applied.
   */
  changeEmail: (email: string) => api.post<ProfileWire>('/me/profile/email', { email }),
}
