import { describe, expect, it } from 'vitest'
import {
  VERSION_INPUT,
  contactPatchOf,
  contactPatchOfForm,
  hasContactChanges,
  storedInput,
} from './contact.changes'
import type { ContactDraft, StoredContact } from './directory.types'

/**
 * The version the fixture row was read at. Every patch below carries it,
 * because a change the API may refuse as stale has to say what it was based
 * on — see "says which version of the row the panel was opened on".
 */
const VERSION = 4

const stored = (over: Partial<StoredContact> = {}): StoredContact => ({
  name: 'Anong Pattana',
  email: 'anong.p@example.com',
  phone: '02 555 0107',
  version: VERSION,
  ...over,
})

/** The panel's three inputs, holding what the row said until something is typed. */
const typed = (over: Partial<ContactDraft> = {}): ContactDraft => ({
  name: 'Anong Pattana',
  email: 'anong.p@example.com',
  phone: '02 555 0107',
  ...over,
})

describe('what a contact save asks the API to change', () => {
  it('sends only the field that moved', () => {
    expect(contactPatchOf(typed({ name: 'Anong Pattana-Suk' }), stored())).toEqual({
      name: 'Anong Pattana-Suk',
      version: VERSION,
    })
  })

  /**
   * Why this is a diff rather than the three boxes posted as they stand.
   * Posting an untouched box back would write a stale value over whatever
   * somebody else corrected in the meantime, and the API cannot tell a
   * retyped value from an untouched one, so it would record it as an edit.
   *
   * The version below is the other half of the same problem: the diff keeps
   * the panel from overwriting a field nobody touched, and the version keeps
   * two organizers from overwriting EACH OTHER on the field they both did.
   */
  it('leaves a field nobody touched out of the request entirely', () => {
    const patch = contactPatchOf(typed({ email: 'anong@example.com' }), stored())

    expect(patch).toEqual({ email: 'anong@example.com', version: VERSION })
    expect('name' in patch).toBe(false)
    expect('phone' in patch).toBe(false)
  })

  /**
   * The version the row was read at rides along with every change.
   *
   * Without it the diff is still last-write-wins on any field two people edit
   * at once: both read `Anong Pattana`, both type a correction, and the second
   * save silently replaces the first. Sent back, the API answers 409 and the
   * organizer is told to reload instead of quietly winning.
   */
  it('says which version of the row the panel was opened on', () => {
    expect(contactPatchOf(typed({ name: 'Anong P.' }), stored({ version: 7 }))).toEqual({
      name: 'Anong P.',
      version: 7,
    })
  })

  // `{}` is answered 400 ("Send a name, email or phone number to change.") —
  // a refusal for having done nothing wrong. The save is not sent at all.
  it('asks for nothing when the form was saved untouched', () => {
    expect(contactPatchOf(typed(), stored())).toEqual({})
    expect(hasContactChanges(contactPatchOf(typed(), stored()))).toBe(false)
  })

  /**
   * Measured, not assumed: `PATCH /attendees/:id` with `version: 0` answers
   * 400 `version must not be less than 1`, and the panel would then show the
   * organizer a refusal naming a box that is not on the form.
   *
   * A version is a guard, and a guard that cannot be supplied must not become
   * a refusal of the whole save: `version` is `@IsOptional()` on the API, so
   * omitting it saves exactly as this panel did before the guard existed. The
   * case is real rather than theoretical — a web deploy that reaches users
   * before the API's is enough to produce it.
   */
  it('omits the version rather than sending one the API will refuse', () => {
    const patch = contactPatchOf(typed({ name: 'Anong P.' }), stored({ version: 0 }))

    expect(patch).toEqual({ name: 'Anong P.' })
    expect('version' in patch).toBe(false)
  })

  /**
   * A version alone is not a change. `hasContactChanges` gates the request, so
   * if the version counted as something to send, an untouched form would PATCH
   * and be answered 400 for having done nothing.
   */
  it('does not count the version as a change to send', () => {
    expect(hasContactChanges(contactPatchOf(typed(), stored()))).toBe(false)
  })

  it('reports a change as something to send', () => {
    expect(hasContactChanges(contactPatchOf(typed({ name: 'Anong P.' }), stored()))).toBe(true)
  })

  // Trailing whitespace is a typo, not an edit — and the API trims it anyway,
  // so sending it would record a change that moved nothing.
  it('trims what was typed, and counts a trim-only edit as no change', () => {
    expect(contactPatchOf(typed({ name: '  Anong Pattana  ' }), stored())).toEqual({})
    expect(contactPatchOf(typed({ email: ' anong@example.com ' }), stored())).toEqual({
      email: 'anong@example.com',
      version: VERSION,
    })
  })

  // `attendees.email` is `citext`, so the API compares these equal but stores
  // what it is given: an organizer fixing the capitalisation is correcting how
  // the address is shown, and the save has to reach the server to do it.
  it('sends an address whose only change is its capitalisation', () => {
    expect(contactPatchOf(typed({ email: 'Anong.P@example.com' }), stored())).toEqual({
      email: 'Anong.P@example.com',
      version: VERSION,
    })
  })

  // The API reads an empty string as "clear it" — the organizer emptied the
  // box, which is a different fact from never having said anything about it.
  it('clears a stored number with an empty string', () => {
    expect(contactPatchOf(typed({ phone: '' }), stored())).toEqual({
      phone: '',
      version: VERSION,
    })
    expect(contactPatchOf(typed({ phone: '   ' }), stored())).toEqual({
      phone: '',
      version: VERSION,
    })
  })

  // Nothing was stored and nothing was typed: there is no clearing to do, and
  // `phone: ''` would record a change on a field the organizer never touched.
  it('says nothing about an empty box over a number that was never recorded', () => {
    expect(contactPatchOf(typed({ phone: '' }), stored({ phone: null }))).toEqual({})
  })

  it('sends a first number for somebody who had none', () => {
    expect(contactPatchOf(typed({ phone: '081 234 5678' }), stored({ phone: null }))).toEqual({
      phone: '081 234 5678',
      version: VERSION,
    })
  })

  // Emptied, and the API refuses it (`@IsNotEmpty`) with a field error the
  // panel shows under the box. Blanking a name is a mistake worth the round
  // trip: the sentence the organizer reads is the API's own.
  it('sends an emptied name rather than quietly dropping it', () => {
    expect(contactPatchOf(typed({ name: '  ' }), stored())).toEqual({
      name: '',
      version: VERSION,
    })
  })
})

/**
 * The panel's own form, as the action reads it back.
 *
 * Worth its own tests because the coupling is silent: the boxes and their
 * hidden twins are read by name, and a mismatched one would arrive as `''`,
 * making an untouched field look edited. The names come from `storedInput` on
 * both sides, so these go through it rather than spelling them out.
 */
describe('the edit panel’s form, as a request to PATCH an attendee', () => {
  const submitted = (
    boxes: Partial<ContactDraft>,
    was: Partial<StoredContact> = {},
  ): FormData => {
    const form = new FormData()
    const draft = typed(boxes)
    const row = stored(was)
    form.set('name', draft.name)
    form.set('email', draft.email)
    form.set('phone', draft.phone)
    form.set(storedInput('name'), row.name)
    form.set(storedInput('email'), row.email)
    form.set(storedInput('phone'), row.phone ?? '')
    form.set(VERSION_INPUT, String(row.version))
    return form
  }

  it('carries the version out of the panel and into the request', () => {
    expect(contactPatchOfForm(submitted({ name: 'Anong P.' }, { version: 9 }))).toEqual({
      name: 'Anong P.',
      version: 9,
    })
  })

  it('asks to change only the box that was typed in', () => {
    expect(contactPatchOfForm(submitted({ phone: '081 000 0000' }))).toEqual({
      phone: '081 000 0000',
      version: VERSION,
    })
  })

  it('asks for nothing from a form saved untouched', () => {
    expect(contactPatchOfForm(submitted({}))).toEqual({})
  })

  // A hidden input can only carry a string, so an unrecorded number arrives as
  // `''` — the same absence as the `null` the row holds, and not a clearing.
  it('reads an unrecorded number as nothing to clear', () => {
    expect(contactPatchOfForm(submitted({ phone: '' }, { phone: null }))).toEqual({})
  })

  it('clears a stored number the organizer emptied', () => {
    expect(contactPatchOfForm(submitted({ phone: '' }))).toEqual({
      phone: '',
      version: VERSION,
    })
  })

  // A panel from before the row carried a version posts no hidden input for
  // it, which must not turn every save into a refusal.
  it('omits the version when the form carried none', () => {
    const form = new FormData()
    form.set('name', 'Anong P.')
    form.set('email', 'anong.p@example.com')
    form.set('phone', '')
    form.set(storedInput('name'), 'Anong Pattana')
    form.set(storedInput('email'), 'anong.p@example.com')
    form.set(storedInput('phone'), '')

    expect(contactPatchOfForm(form)).toEqual({ name: 'Anong P.' })
  })

  // Every box missing is not "clear everything": a form that posted nothing at
  // all has nothing to say about any field.
  it('asks for nothing when the form carried no boxes at all', () => {
    expect(contactPatchOfForm(new FormData())).toEqual({})
  })
})
