import { describe, expect, it } from 'vitest'
import { unattachedError } from './refusal'

describe('which refusal belongs at the top of a compose form', () => {
  it('is nothing while nothing has been refused', () => {
    expect(unattachedError(null)).toBeNull()
    expect(unattachedError({ ok: true })).toBeNull()
  })

  // "It has already started sending." is about the announcement, not an input.
  it('is the API’s sentence when it named no field', () => {
    expect(unattachedError({ ok: false, error: 'It has already started sending.' })).toBe(
      'It has already started sending.',
    )
  })

  /**
   * A 422 on the time arrives as both: `messageOf` promotes the field messages
   * into the top-level sentence. The field renders it under the input, so the
   * banner has to stay out of the way or the organizer reads it twice.
   */
  it('is nothing when every refusal was pinned to a field', () => {
    expect(
      unattachedError({
        ok: false,
        error: 'Pick a time at least 5 minutes from now.',
        fieldErrors: { sendAt: 'Pick a time at least 5 minutes from now.' },
      }),
    ).toBeNull()
  })

  it('is nothing when a failure came with no sentence at all', () => {
    expect(unattachedError({ ok: false })).toBeNull()
  })
})
