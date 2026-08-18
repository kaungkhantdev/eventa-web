import { describe, expect, it } from 'vitest'
import { handoffOf } from './signupHandoff'

describe('handoffOf', () => {
  it('reads the name and email carried from the order page', () => {
    expect(handoffOf({ name: 'Somchai', email: 'buyer@example.test' })).toEqual({
      name: 'Somchai',
      email: 'buyer@example.test',
    })
  })

  it('is empty when nothing was carried', () => {
    expect(handoffOf(null)).toEqual({ name: '', email: '' })
    expect(handoffOf(undefined)).toEqual({ name: '', email: '' })
  })

  /**
   * History state is untrusted: anything can push anything onto it, and it
   * survives a reload. Fields that are not strings are dropped rather than
   * rendered — an object stringified into a form value is how "[object Object]"
   * ends up in somebody's account name.
   */
  it('ignores state that is not the expected shape', () => {
    expect(handoffOf('a string')).toEqual({ name: '', email: '' })
    expect(handoffOf({ name: 42, email: { at: 'x' } })).toEqual({
      name: '',
      email: '',
    })
  })

  it('keeps a field that is present when its neighbour is not', () => {
    expect(handoffOf({ email: 'buyer@example.test' })).toEqual({
      name: '',
      email: 'buyer@example.test',
    })
  })

  it('trims, so a stray space does not become part of the address', () => {
    expect(handoffOf({ name: ' Somchai ', email: ' buyer@example.test ' })).toEqual({
      name: 'Somchai',
      email: 'buyer@example.test',
    })
  })
})
