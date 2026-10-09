import { describe, expect, it } from 'vitest'
import {
  contactPatchOf,
  contactPatchOfForm,
  hasContactChanges,
  storedInput,
} from './contact.changes'
import type { ContactDraft, StoredContact } from './directory.types'

const stored = (over: Partial<StoredContact> = {}): StoredContact => ({
  name: 'Anong Pattana',
  email: 'anong.p@example.com',
  phone: '02 555 0107',
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
    })
  })

  /**
   * The whole reason this is a diff rather than the three boxes posted as they
   * stand: `GET /attendees` carries no `version`, so the panel cannot tell the
   * API which row it was opened on. Posting an untouched box back would write
   * a stale value over whatever somebody else corrected in the meantime —
   * silently, because the API has no way to know it was never typed in.
   */
  it('leaves a field nobody touched out of the request entirely', () => {
    const patch = contactPatchOf(typed({ email: 'anong@example.com' }), stored())

    expect(patch).toEqual({ email: 'anong@example.com' })
    expect('name' in patch).toBe(false)
    expect('phone' in patch).toBe(false)
  })

  // `{}` is answered 400 ("Send a name, email or phone number to change.") —
  // a refusal for having done nothing wrong. The save is not sent at all.
  it('asks for nothing when the form was saved untouched', () => {
    expect(contactPatchOf(typed(), stored())).toEqual({})
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
    })
  })

  // `attendees.email` is `citext`, so the API compares these equal but stores
  // what it is given: an organizer fixing the capitalisation is correcting how
  // the address is shown, and the save has to reach the server to do it.
  it('sends an address whose only change is its capitalisation', () => {
    expect(contactPatchOf(typed({ email: 'Anong.P@example.com' }), stored())).toEqual({
      email: 'Anong.P@example.com',
    })
  })

  // The API reads an empty string as "clear it" — the organizer emptied the
  // box, which is a different fact from never having said anything about it.
  it('clears a stored number with an empty string', () => {
    expect(contactPatchOf(typed({ phone: '' }), stored())).toEqual({ phone: '' })
    expect(contactPatchOf(typed({ phone: '   ' }), stored())).toEqual({ phone: '' })
  })

  // Nothing was stored and nothing was typed: there is no clearing to do, and
  // `phone: ''` would record a change on a field the organizer never touched.
  it('says nothing about an empty box over a number that was never recorded', () => {
    expect(contactPatchOf(typed({ phone: '' }), stored({ phone: null }))).toEqual({})
  })

  it('sends a first number for somebody who had none', () => {
    expect(contactPatchOf(typed({ phone: '081 234 5678' }), stored({ phone: null }))).toEqual({
      phone: '081 234 5678',
    })
  })

  // Emptied, and the API refuses it (`@IsNotEmpty`) with a field error the
  // panel shows under the box. Blanking a name is a mistake worth the round
  // trip: the sentence the organizer reads is the API's own.
  it('sends an emptied name rather than quietly dropping it', () => {
    expect(contactPatchOf(typed({ name: '  ' }), stored())).toEqual({ name: '' })
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
    return form
  }

  it('asks to change only the box that was typed in', () => {
    expect(contactPatchOfForm(submitted({ phone: '081 000 0000' }))).toEqual({
      phone: '081 000 0000',
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
    expect(contactPatchOfForm(submitted({ phone: '' }))).toEqual({ phone: '' })
  })

  // Every box missing is not "clear everything": a form that posted nothing at
  // all has nothing to say about any field.
  it('asks for nothing when the form carried no boxes at all', () => {
    expect(contactPatchOfForm(new FormData())).toEqual({})
  })
})
