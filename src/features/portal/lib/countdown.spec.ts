import { describe, expect, it } from 'vitest'
import { remainingOf } from './countdown'

const NOW = new Date('2026-08-17T05:00:00.000Z')

const at = (iso: string | null) => remainingOf(iso, NOW)

describe('remainingOf', () => {
  it('counts whole minutes and seconds down to the deadline', () => {
    expect(at('2026-08-17T05:08:30.000Z')).toMatchObject({ label: '8:30', lapsed: false })
  })

  // A bare "8:5" reads as eight minutes and five minutes.
  it('pads the seconds', () => {
    expect(at('2026-08-17T05:08:05.000Z').label).toBe('8:05')
  })

  it('is lapsed on the deadline itself, not a second after', () => {
    expect(at('2026-08-17T05:00:00.000Z')).toMatchObject({ label: '0:00', lapsed: true })
  })

  // Never a negative clock: a deadline in the past is simply gone.
  it('does not count past zero', () => {
    expect(at('2026-08-17T04:30:00.000Z')).toMatchObject({ label: '0:00', lapsed: true })
  })

  /**
   * No deadline is not an expired one. An order with no hold was never on the
   * clock, and rendering it as `0:00` would tell the buyer they had run out of
   * time they were never given.
   */
  it('has no clock at all when there is no deadline', () => {
    expect(at(null)).toMatchObject({ label: null, lapsed: false })
  })

  it('carries minutes over an hour rather than wrapping', () => {
    expect(at('2026-08-17T06:05:00.000Z').label).toBe('65:00')
  })
})
