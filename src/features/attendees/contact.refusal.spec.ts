import { describe, expect, it } from 'vitest'
import { contactRefusalOf } from './contact.refusal'

/**
 * The sentence the API writes when the address is already somebody else's
 * (`ATTENDEE_EMAIL_IN_USE`). It is not a field error — the organizer typed a
 * perfectly valid address and the workspace simply already knows that person —
 * so it carries the remedy, and the console shows it verbatim.
 */
const EMAIL_IN_USE =
  'That email address already belongs to another attendee in this workspace. ' +
  'Merge the two records instead of overwriting — a second record on the same ' +
  'address would split one person’s registrations in two. Search the directory ' +
  'for the address to open the record that holds it.'

describe('where a refused contact save is shown', () => {
  it('says nothing while nothing has been refused', () => {
    expect(contactRefusalOf(null)).toEqual({ banner: null, fields: {} })
    expect(contactRefusalOf(undefined)).toEqual({ banner: null, fields: {} })
    expect(contactRefusalOf({ ok: true })).toEqual({ banner: null, fields: {} })
  })

  // AC4: an invalid name or email is answered beside the box it is about, and
  // nothing is applied. `messageOf` promotes field messages into the top-level
  // sentence, so rendering both would print the organizer the same words twice.
  it('puts a rejected field under that field and nowhere else', () => {
    expect(
      contactRefusalOf({
        ok: false,
        error: 'Enter the attendee’s name.',
        fieldErrors: { name: 'Enter the attendee’s name.' },
      }),
    ).toEqual({ banner: null, fields: { name: 'Enter the attendee’s name.' } })
  })

  it('keeps a refusal about each of the three boxes', () => {
    const refusal = contactRefusalOf({
      ok: false,
      error: 'Validation failed.',
      fieldErrors: {
        name: 'name should not be empty',
        email: 'email must be an email',
        phone: 'phone must be shorter than or equal to 24 characters',
      },
    })

    expect(refusal.fields.name).toBe('name should not be empty')
    expect(refusal.fields.email).toBe('email must be an email')
    expect(refusal.fields.phone).toBe('phone must be shorter than or equal to 24 characters')
    expect(refusal.banner).toBeNull()
  })

  /**
   * AC3. The collision is a conflict with a remedy, not a verdict on the box:
   * reducing it to "email invalid" under the input would lose the instruction
   * the API wrote, so it goes above the form, in full, and the email box is
   * left unmarked because what is in it is not wrong.
   */
  it('shows the merge prompt above the form, verbatim, and marks no field', () => {
    expect(contactRefusalOf({ ok: false, error: EMAIL_IN_USE })).toEqual({
      banner: EMAIL_IN_USE,
      fields: {},
    })
  })

  // Somebody else corrected the same attendee while the form was open.
  it('shows a stale row above the form, where there is no box to blame', () => {
    const moved = 'This attendee changed while you had the form open. Reload and try again.'
    expect(contactRefusalOf({ ok: false, error: moved }).banner).toBe(moved)
  })

  // `regManage` only tidies the console; the API is what enforces it, and a
  // 403 has to land somewhere the organizer can read it.
  it('shows a refused permission above the form', () => {
    expect(contactRefusalOf({ ok: false, error: "You don't have access to that." }).banner).toBe(
      "You don't have access to that.",
    )
  })

  /**
   * A field error this panel has no box for — `version`, or a property name
   * from `forbidNonWhitelisted`. Pinning it to an input that does not exist
   * would show the organizer nothing at all, so it falls back to the banner,
   * where `messageOf` has already put the same words.
   */
  it('falls back to the banner for a field this form cannot show', () => {
    expect(
      contactRefusalOf({
        ok: false,
        error: 'version must be an integer number',
        fieldErrors: { version: 'version must be an integer number' },
      }),
    ).toEqual({ banner: 'version must be an integer number', fields: {} })
  })

  it('keeps the boxes it knows and banners nothing when one is unknown', () => {
    const refusal = contactRefusalOf({
      ok: false,
      error: 'Validation failed.',
      fieldErrors: { email: 'email must be an email', version: 'version must be an integer number' },
    })

    expect(refusal.fields).toEqual({ email: 'email must be an email' })
    expect(refusal.banner).toBeNull()
  })
})
