import { describe, expect, it } from 'vitest'
import { toAttendeeProfileCard, toProfilePatch } from './profile.mapper'
import type { ProfileWire } from './profile.types'

/**
 * The Profile tab's rules (US-DISC-11).
 *
 * The kit shipped this tab with a person in it — "Phanit", "+66 81 234 5678",
 * "AP", "12 events attended" — so every test here is about showing the signed-in
 * person's own record instead, and saying nothing where the API holds nothing.
 */

const wire = (over: Partial<ProfileWire> = {}): ProfileWire => ({
  id: 'u-1',
  name: 'Araya Phanit',
  email: 'araya@example.co.th',
  pendingEmail: null,
  emailVerified: true,
  phone: '+66812345678',
  timezone: 'Asia/Bangkok',
  locale: 'en',
  avatarUrl: null,
  city: 'Bangkok',
  dateOfBirth: '1994-03-15',
  bio: 'Loves tech meetups and weekend yoga.',
  displayCurrency: 'THB',
  ...over,
})

describe('the attendee’s own profile', () => {
  it('derives the initials from whoever is signed in', () => {
    // The kit hard-coded "AP" on the avatar tile, which was wrong for everyone
    // but the person in the mockup.
    expect(toAttendeeProfileCard(wire({ name: 'Niran Suksawat' })).initials).toBe('NS')
    expect(toAttendeeProfileCard(wire({ name: 'Araya Phanit' })).initials).toBe('AP')
  })

  it('carries the name, email and photo through as the API holds them', () => {
    const card = toAttendeeProfileCard(
      wire({ avatarUrl: 'https://cdn.eventa.co.th/avatars/u-1/a.jpg' }),
    )
    expect(card.name).toBe('Araya Phanit')
    expect(card.email).toBe('araya@example.co.th')
    expect(card.avatarUrl).toBe('https://cdn.eventa.co.th/avatars/u-1/a.jpg')
  })
})

describe('a field nobody has filled in', () => {
  it('renders as empty, never as the word "null"', () => {
    const card = toAttendeeProfileCard(
      wire({ phone: null, city: null, bio: null, dateOfBirth: null }),
    )
    expect(card.phone).toBe('')
    expect(card.city).toBe('')
    expect(card.bio).toBe('')
    expect(card.dateOfBirth).toBe('')
    // A `null` bound to an input renders the four characters "null".
    expect(Object.values(card)).not.toContain('null')
  })

  it('leaves the photo as null rather than an empty string', () => {
    // An `<img src="">` re-requests the page; the absent photo is the initials
    // tile, which the tab chooses on `null`.
    expect(toAttendeeProfileCard(wire({ avatarUrl: null })).avatarUrl).toBeNull()
  })

  it('falls back to English when no language is stored', () => {
    expect(toAttendeeProfileCard(wire({ locale: null })).locale).toBe('en')
    expect(toAttendeeProfileCard(wire({ locale: 'th' })).locale).toBe('th')
  })

  it('leaves an unset timezone empty rather than guessing the browser’s', () => {
    // Time is Asia/Bangkok on screen by product rule, but "which zone is this
    // person in" is a fact the API holds or does not.
    expect(toAttendeeProfileCard(wire({ timezone: null })).timezone).toBe('')
  })
})

describe('a date of birth', () => {
  it('stays the calendar date the API stored', () => {
    expect(toAttendeeProfileCard(wire({ dateOfBirth: '1994-03-15' })).dateOfBirth).toBe(
      '1994-03-15',
    )
  })

  it('is not shifted by a timezone conversion', () => {
    // `new Date('1994-03-15')` is midnight UTC — 07:00 in Bangkok, but the
    // previous evening in New York. Anything that formats it as an instant can
    // move somebody's birthday by a day, so nothing here does.
    for (const day of ['1994-01-01', '1994-12-31', '2000-02-29']) {
      expect(toAttendeeProfileCard(wire({ dateOfBirth: day })).dateOfBirth).toBe(day)
    }
  })
})

describe('an email change in flight', () => {
  it('keeps the old address as the one that signs in', () => {
    // Criterion 2: the change is not done until the link in the new inbox is
    // opened, and until then the old address still works.
    const card = toAttendeeProfileCard(
      wire({ emailVerified: false, pendingEmail: 'new@example.co.th' }),
    )
    expect(card.email).toBe('araya@example.co.th')
    expect(card.pendingEmail).toBe('new@example.co.th')
    expect(card.emailVerified).toBe(false)
  })

  it('reports itself as pending rather than verified', () => {
    const pending = toAttendeeProfileCard(
      wire({ emailVerified: false, pendingEmail: 'new@example.co.th' }),
    )
    expect(pending.emailStatus).toEqual({ tone: 'amber', label: 'Pending' })
  })

  it('reports a settled address as verified', () => {
    const settled = toAttendeeProfileCard(wire({ emailVerified: true, pendingEmail: null }))
    expect(settled.emailStatus).toEqual({ tone: 'green', label: 'Verified' })
    expect(settled.pendingEmail).toBeNull()
  })

  it('still says "pending" when the new address is not disclosed', () => {
    // `emailVerified: false` is the fact the badge reports; `pendingEmail` is
    // only there to name the inbox to go and check.
    const card = toAttendeeProfileCard(wire({ emailVerified: false, pendingEmail: null }))
    expect(card.emailStatus.tone).toBe('amber')
  })
})

/* ------------------------- the form going back out ----------------------- */

const submitted = (fields: Record<string, string>): FormData => {
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) form.append(name, value)
  return form
}

const filled = {
  name: 'Araya Phanit',
  phone: '+66812345678',
  city: 'Bangkok',
  dateOfBirth: '1994-03-15',
  bio: 'Loves tech meetups.',
}

describe('saving the details form', () => {
  it('sends what was typed, trimmed', () => {
    expect(toProfilePatch(submitted({ ...filled, name: '  Araya Phanit  ' }))).toEqual(filled)
  })

  it('clears an emptied box rather than saving an empty string', () => {
    // `UpdateProfileDto` spells "I no longer have one" as `null`; `''` would be
    // a phone number of no characters, which the organizer would then "have".
    const patch = toProfilePatch(submitted({ name: 'Araya Phanit' }))
    expect(patch).toEqual({
      name: 'Araya Phanit',
      phone: null,
      city: null,
      dateOfBirth: null,
      bio: null,
    })
  })

  it('treats a box holding only spaces as cleared', () => {
    expect(toProfilePatch(submitted({ ...filled, city: '   ' })).city).toBeNull()
  })

  it('sends only the boxes this tab shows', () => {
    // A partial patch: `timezone`, `locale` and `displayCurrency` are absent
    // from this form, so they must be absent from the body. Sending them as
    // `null` would clear, from here, settings this tab never displayed.
    const keys = Object.keys(toProfilePatch(submitted(filled))).sort()
    expect(keys).toEqual(['bio', 'city', 'dateOfBirth', 'name', 'phone'])
  })

  it('never carries the email address', () => {
    // Moving the address you sign in with is its own confirmed flow
    // (`POST /me/profile/email`); `UpdateProfileDto` has no `email` at all, so
    // a stray one here would be silently dropped and look like it had saved.
    const patch = toProfilePatch(submitted({ ...filled, email: 'new@example.co.th' }))
    expect(patch).not.toHaveProperty('email')
  })

  it('keeps a date of birth as the calendar date the box held', () => {
    // Not parsed and re-serialised: `new Date('1994-01-01')` is midnight UTC,
    // and formatting that anywhere west of Greenwich moves the birthday a day.
    for (const day of ['1994-01-01', '1994-12-31', '2000-02-29']) {
      expect(toProfilePatch(submitted({ ...filled, dateOfBirth: day })).dateOfBirth).toBe(day)
    }
  })
})
