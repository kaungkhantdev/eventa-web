import { describe, expect, it } from 'vitest'
import { handoffOf } from './signupHandoff'

describe('handoffOf', () => {
  it('reads the address a sign-up handed to its check-email page', () => {
    expect(handoffOf({ email: 'buyer@example.test' })).toEqual({ email: 'buyer@example.test' })
  })

  it('is empty when nothing was carried', () => {
    expect(handoffOf(null)).toEqual({ email: '' })
    expect(handoffOf(undefined)).toEqual({ email: '' })
  })

  /**
   * History state is untrusted: anything can push anything onto it, and it
   * survives a reload. A field that is not a string is dropped rather than
   * rendered — an object stringified onto the page is how "[object Object]"
   * ends up where somebody's address should be.
   */
  it('ignores state that is not the expected shape', () => {
    expect(handoffOf('a string')).toEqual({ email: '' })
    expect(handoffOf({ email: { at: 'x' } })).toEqual({ email: '' })
  })

  // US-DISC-15: a booking no longer hands its buyer to the sign-up form — the
  // account is made from a link emailed to the booking's address — so nothing
  // carried in history state can fill in, or fix, a sign-up field any more.
  it('carries nothing but the address', () => {
    expect(handoffOf({ name: 'Somchai', email: 'buyer@example.test' })).toEqual({
      email: 'buyer@example.test',
    })
  })

  it('trims, so a stray space does not become part of the address', () => {
    expect(handoffOf({ email: ' buyer@example.test ' })).toEqual({ email: 'buyer@example.test' })
  })
})
