import { initials } from '@/lib/format'
import type { AttendeeProfileCard, ProfilePatch, ProfileWire } from './profile.types'

/**
 * `/me/profile` → the Profile tab's view model (US-DISC-11).
 *
 * The kit's markup carried a person: a surname, a phone number, a city, a date
 * of birth, a bio and the initials "AP". None of it belonged to whoever was
 * signed in. Everything on that card now comes from here, and where the API
 * holds nothing the field is empty rather than filled with a plausible guess.
 */

/** A form binds to a string; `null` in an input renders the word "null". */
const text = (value: string | null): string => value ?? ''

const DEFAULT_LOCALE = 'en' as const

/**
 * What the badge beside the address says.
 *
 * Amber, not red: an unconfirmed change is a step somebody still has to take,
 * not a fault. The old address goes on working until the link is opened, so
 * nothing is broken while this is showing.
 */
const VERIFIED = { tone: 'green', label: 'Verified' } as const
const PENDING = { tone: 'amber', label: 'Pending' } as const

export function toAttendeeProfileCard(profile: ProfileWire): AttendeeProfileCard {
  return {
    name: profile.name,
    initials: initials(profile.name),
    avatarUrl: profile.avatarUrl,
    // The address that signs in — not `pendingEmail`. A change of address is
    // not done until it is confirmed, and swapping it here would tell somebody
    // to sign in with an address that does not work yet (criterion 2).
    email: profile.email,
    emailVerified: profile.emailVerified,
    pendingEmail: profile.pendingEmail,
    emailStatus: profile.emailVerified ? VERIFIED : PENDING,
    phone: text(profile.phone),
    city: text(profile.city),
    // Passed through as the `YYYY-MM-DD` the API stores, deliberately WITHOUT
    // going through `@/lib/format`'s Bangkok formatters. A date of birth is a
    // calendar date, not an instant: `new Date('1994-03-15')` is midnight UTC,
    // which is already the 15th in Bangkok but still the 14th in New York, so
    // formatting it in any zone can move somebody's birthday by a day. It is
    // also exactly what `<input type="date">` reads and what the PATCH takes.
    dateOfBirth: text(profile.dateOfBirth),
    bio: text(profile.bio),
    timezone: text(profile.timezone),
    locale: profile.locale ?? DEFAULT_LOCALE,
  }
}

/* ------------------------- the form going back out ----------------------- */

const typed = (form: FormData, field: string): string => String(form.get(field) ?? '').trim()

/** An emptied box means "I no longer have one", which the API spells `null`. */
const cleared = (form: FormData, field: string): string | null => typed(form, field) || null

/**
 * The details form → `PATCH /me/profile`.
 *
 * Deliberately only the five boxes this tab shows. `UpdateProfileDto` is a
 * partial patch, so an omitted key is left alone — and `timezone`, `locale` and
 * `displayCurrency` are omitted precisely because this form never displayed
 * them: sending them would let a save here clear a preference somebody set on
 * another screen, which they would have no way of seeing happen.
 *
 * `email` is absent because the API's is: moving the address you sign in with
 * goes through `POST /me/profile/email` and a link in the new inbox.
 */
export function toProfilePatch(form: FormData): ProfilePatch {
  return {
    name: typed(form, 'name'),
    phone: cleared(form, 'phone'),
    city: cleared(form, 'city'),
    // Straight through as the `YYYY-MM-DD` the box held — never via `Date`,
    // for the reason given above.
    dateOfBirth: cleared(form, 'dateOfBirth'),
    bio: cleared(form, 'bio'),
  }
}
