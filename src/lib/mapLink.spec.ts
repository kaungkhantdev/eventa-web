import { describe, expect, it } from 'vitest'
import { mapEmbedFor, mapLinkFor } from './mapLink'

/**
 * The same place, as something that can go in an `<iframe>`.
 *
 * Two forms, because Google offers two: the documented Embed API, which needs
 * a key, and the keyless `output=embed`, which does not. Which one is used is
 * decided by whether a key has been configured — so the map works with no
 * setup, and gets the supported endpoint the moment a key exists.
 */
describe('mapEmbedFor', () => {
  const VENUE = { venueName: 'Siam Paragon', address: '999/9 Rama I Rd', city: 'Bangkok' }

  it('uses the documented Embed API when a key is configured', () => {
    const url = mapEmbedFor(VENUE, 'AIza-not-a-real-key')
    expect(url).toContain('https://www.google.com/maps/embed/v1/place')
    expect(url).toContain('key=AIza-not-a-real-key')
    // The street, not the venue name — see "when they disagree" above.
    expect(url).toContain('999%2F9')
  })

  it('falls back to the keyless embed when none is', () => {
    const url = mapEmbedFor(VENUE)
    expect(url).toContain('output=embed')
    expect(url).not.toContain('key=')
  })

  it('treats a blank key as no key — an empty `key=` is a broken request', () => {
    expect(mapEmbedFor(VENUE, '   ')).toContain('output=embed')
  })

  it('shows nothing when there is nowhere to show', () => {
    expect(mapEmbedFor({})).toBeNull()
  })

  it('escapes the query in both forms', () => {
    const venue = { venueName: 'Hall #3 & Foyer' }
    expect(mapEmbedFor(venue)).toContain('%23')
    expect(mapEmbedFor(venue, 'k')).toContain('%23')
  })
})

/**
 * A link to the venue on a map, built from what the organizer typed.
 *
 * Derived rather than stored on purpose: a saved URL and an edited address
 * drift apart silently, and the one that misleads an attendee at 7pm on the
 * night is the stale one.
 */
describe('mapLinkFor', () => {
  it('searches for a street address, with the city that places it', () => {
    const url = mapLinkFor({ address: '88 Bangna-Trad Rd', city: 'Bangkok' })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=88%20Bangna-Trad%20Rd%2C%20Bangkok',
    )
  })

  it('combines the venue and its city when there is no street address', () => {
    // The city is often what makes a venue name resolve — there are BITECs and
    // Impact Arenas in more than one country.
    const url = mapLinkFor({ venueName: 'BITEC', city: 'Bangkok' })
    expect(url).toContain('BITEC%2C%20Bangkok')
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

  /**
   * The rule that decides WHICH place is meant when the two fields disagree.
   *
   * "BITEC" is in Bang Na. "999/9 Rama I Rd, Pathum Wan" is fifteen kilometres
   * away. Sent together, Google resolves the NAME and drops the pin at BITEC —
   * so an organizer who corrected the address watched the map ignore them.
   *
   * A street address is the more specific claim and the one a geocoder is built
   * to read, so it is sent alone. The venue name is for the human reading the
   * page, not for the search.
   */
  describe('when the venue name and the street address disagree', () => {
    it('trusts the street address, not the venue name', () => {
      const url = mapLinkFor({
        venueName: 'BITEC',
        address: '999/9 Rama I Rd, Pathum Wan, Bangkok 10330',
      })
      expect(url).toContain('999%2F9')
      expect(url).not.toContain('BITEC')
    })

    it('still adds the city when the address does not carry one', () => {
      const url = mapLinkFor({ venueName: 'BITEC', address: '88 Bangna-Trad Rd', city: 'Bangkok' })
      expect(url).toContain('Bangkok')
      expect(url).not.toContain('BITEC')
    })

    /**
     * "Hall 3" is a room, not an address — it cannot be found on its own, so
     * the venue name is what makes it locatable. Only an address with a street
     * name is trusted alone.
     */
    it('keeps the venue name when the address is only a room or a floor', () => {
      expect(mapLinkFor({ venueName: 'BITEC', address: 'Hall 3' })).toContain('BITEC')
    })

    it('keeps the venue name when there is no address at all', () => {
      expect(mapLinkFor({ venueName: 'BITEC', city: 'Bangkok' })).toContain('BITEC')
    })
  })
})
