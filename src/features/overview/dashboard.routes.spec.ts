import { describe, expect, it } from 'vitest'
import { rangeOf } from './dashboard.routes'

describe('rangeOf', () => {
  it('defaults to the year view (US-DASH-09)', () => {
    expect(rangeOf(new URLSearchParams())).toBe('year')
  })

  it('reads the range the URL asks for, so the back button works', () => {
    expect(rangeOf(new URLSearchParams('range=week'))).toBe('week')
    expect(rangeOf(new URLSearchParams('range=month'))).toBe('month')
  })

  // A hand-edited URL must not reach the API as an unknown enum and 400 the
  // whole page — the toggle has three positions and nothing else.
  it('falls back rather than passing a made-up range to the API', () => {
    expect(rangeOf(new URLSearchParams('range=decade'))).toBe('year')
  })
})
