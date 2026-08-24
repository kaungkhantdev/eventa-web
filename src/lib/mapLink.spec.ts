import { describe, expect, it } from 'vitest'
import { mapLinkFor } from './mapLink'

/**
 * A link to the venue on a map, built from what the organizer typed.
 *
 * Derived rather than stored on purpose: a saved URL and an edited address
 * drift apart silently, and the one that misleads an attendee at 7pm on the
 * night is the stale one.
 */
describe('mapLinkFor', () => {
  it('searches for the venue and its address together', () => {
    const url = mapLinkFor({ venueName: 'BITEC', address: '88 Bangna-Trad Rd' })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=BITEC%2C%2088%20Bangna-Trad%20Rd',
    )
  })

  it('adds the city, which is often what makes an address findable', () => {
    const url = mapLinkFor({ venueName: 'BITEC', address: '88 Bangna-Trad Rd', city: 'Bangkok' })
    expect(url).toContain('Bangkok')
  })

  it('works from a venue name alone — a known venue needs no street', () => {
    expect(mapLinkFor({ venueName: 'BITEC' })).toContain('query=BITEC')
  })

  it('works from an address alone', () => {
    expect(mapLinkFor({ address: '88 Bangna-Trad Rd' })).toContain('Bangna-Trad')
  })

  /**
   * The link is only offered once there is something to search for. A map of
   * the empty string drops the attendee somewhere off the coast of Africa.
   */
  it('offers nothing when there is nothing to look up', () => {
    expect(mapLinkFor({})).toBeNull()
    expect(mapLinkFor({ venueName: '   ', address: '' })).toBeNull()
  })

  it('escapes what was typed, so a query cannot break out of the URL', () => {
    const url = mapLinkFor({ venueName: 'Hall #3 & Foyer', address: 'Rama IV Rd' })
    expect(url).toContain('%23')
    expect(url).toContain('%26')
    expect(url).not.toContain('#3')
  })

  /** Repeating the city because it is already in the address helps nobody. */
  it('does not repeat a part that already appears', () => {
    const url = mapLinkFor({ address: 'Bangna, Bangkok', city: 'Bangkok' })
    expect(url?.match(/Bangkok/g)).toHaveLength(1)
  })
})
