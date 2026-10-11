import type { BadgeTone } from '@/components/ui'

/**
 * The signed-in person's own record — `/me/profile` and `/me/photo`, as
 * eventa-api describes them (US-DISC-11).
 *
 * `/me/*` is whoever holds the token, so the attendee portal and the organizer
 * console read the same endpoints; these shapes mirror `ProfileResponseDto` and
 * `PhotoDto` field for field.
 *
 * `PhotoUploadDto` is deliberately NOT mirrored here: every image upload in
 * this app — photo, workspace logo, event cover — is issued by one server
 * service and read through one type, `IssuedUpload` in `@/lib/signedUpload`,
 * which also carries the note on what its signed headers bind.
 *
 * Wire shapes; nothing outside the mapper reads them.
 */

/**
 * `ProfileWire` and `ProfilePatch` live in `@/lib/api`: the organizer console
 * edits the same `/me/profile` row from `settings`, and one endpoint described
 * in two features is one that drifts. Re-exported so this feature's modules
 * keep importing their wire shapes from one place.
 */
export type { ProfilePatch, ProfileWire } from '@/lib/api'

/** The profile photo after a confirmed upload. */
export interface PhotoWire {
  avatarUrl: string
}

/* ------------------------------ view models ------------------------------ */

/**
 * What the Profile tab renders.
 *
 * Every text field is a string because it binds to an input: `null` in a
 * `value` renders the word "null". `avatarUrl` stays nullable — it is the
 * choice between the photo and the initials tile, not a form value.
 */
export interface AttendeeProfileCard {
  name: string
  /** From the real name, replacing the kit's hard-coded "AP". */
  initials: string
  avatarUrl: string | null
  /** The address that signs in today — the old one while a change is pending. */
  email: string
  emailVerified: boolean
  /** The address awaiting confirmation, or `null` when none is. */
  pendingEmail: string | null
  /** How the tab labels the state of the address. */
  emailStatus: { tone: BadgeTone; label: string }
  /** The CONFIRMED number — the one Eventa texts — or `''`. */
  phone: string
  /** A number waiting for its code; the confirmed one still works. */
  pendingPhone: string | null
  /** False until a texted code has been typed back (US-DISC-11 AC3). */
  phoneVerified: boolean
  city: string
  /** `YYYY-MM-DD` for `<input type="date">`, or `''` when not given. */
  dateOfBirth: string
  bio: string
  timezone: string
  locale: 'en' | 'th'
}
