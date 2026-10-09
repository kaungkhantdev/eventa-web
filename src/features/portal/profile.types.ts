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
  phone: string
  city: string
  /** `YYYY-MM-DD` for `<input type="date">`, or `''` when not given. */
  dateOfBirth: string
  bio: string
  timezone: string
  locale: 'en' | 'th'
}
