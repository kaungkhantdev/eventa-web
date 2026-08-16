import { describe, expect, it } from 'vitest'
import { toDiscoverCard } from './discover.mapper'
import type { EventCardWire } from './discover.types'

const WIRE: EventCardWire = {
  id: '82077f15-9ea8-427d-8876-18d796b362ee',
  slug: 'tech-summit-2026',
  name: 'Tech Summit 2026',
  type: 'Conference',
  categoryName: 'Conference',
  startAt: '2026-07-18T02:00:00.000Z',
  endAt: '2026-07-19T11:00:00.000Z',
  timezone: 'Asia/Bangkok',
  isOnline: false,
  venueName: 'BITEC',
  city: 'Bangkok',
  coverImage: null,
  organizerName: 'Eventa Co.',
  goingCount: 1240,
  priceFrom: '฿1,250',
  badge: null,
  rating: 4.6,
}

const card = (patch: Partial<EventCardWire> = {}) => toDiscoverCard({ ...WIRE, ...patch })

describe('toDiscoverCard', () => {
  it('carries the event through unchanged where nothing has to be decided', () => {
    expect(card()).toMatchObject({
      id: WIRE.id,
      slug: 'tech-summit-2026',
      name: 'Tech Summit 2026',
      category: 'Conference',
      organizer: 'Eventa Co.',
      going: '1,240',
    })
  })

  describe('price', () => {
    it('shows the API’s own label, prefixed by the card as "From"', () => {
      expect(card().price).toEqual({ label: '฿1,250', isFree: false })
    })

    it('marks a free event so it reads as one word rather than "From Free"', () => {
      expect(card({ priceFrom: 'Free' }).price).toEqual({ label: 'Free', isFree: true })
    })

    // Nothing left to buy is not the same fact as costing nothing.
    it('leaves the price out entirely when no tier is available', () => {
      expect(card({ priceFrom: null }).price).toBeNull()
    })
  })

  describe('rating', () => {
    it('renders to one decimal', () => {
      expect(card({ rating: 4.6 }).rating).toBe('4.6')
      expect(card({ rating: 5 }).rating).toBe('5.0')
    })

    // The kit derived a rating from the slug. An unrated event has none.
    it('is null when the event has not been rated', () => {
      expect(card({ rating: null }).rating).toBeNull()
    })
  })

  describe('when', () => {
    it('reads a single day on the Bangkok calendar', () => {
      expect(card({ startAt: '2026-07-18T02:00:00.000Z', endAt: null }).when).toBe(
        'Sat, Jul 18, 2026',
      )
    })

    it('collapses a range inside one month to a single month and year', () => {
      expect(card().when).toBe('Sat–Sun, Jul 18–19, 2026')
    })

    it('spells both months when the event crosses one', () => {
      expect(card({ startAt: '2026-07-30T02:00:00.000Z', endAt: '2026-08-02T02:00:00.000Z' }).when)
        .toBe('Jul 30 – Aug 2, 2026')
    })

    // 20:00 UTC is already the next day in Bangkok. Bucketing by the viewer's
    // own clock would file an evening event a day early.
    it('reads the Bangkok day, not the browser’s', () => {
      expect(card({ startAt: '2026-07-18T20:00:00.000Z', endAt: null }).when).toBe(
        'Sun, Jul 19, 2026',
      )
    })

    it('treats an end on the same Bangkok day as a single day', () => {
      expect(card({ startAt: '2026-07-18T02:00:00.000Z', endAt: '2026-07-18T11:00:00.000Z' }).when)
        .toBe('Sat, Jul 18, 2026')
    })
  })

  describe('where', () => {
    it('joins the venue and the city', () => {
      expect(card().where).toBe('BITEC, Bangkok')
    })

    it('falls back to whichever of the two the event has', () => {
      expect(card({ venueName: null }).where).toBe('Bangkok')
      expect(card({ city: null }).where).toBe('BITEC')
    })

    it('says Online when there is nowhere to go', () => {
      expect(card({ isOnline: true, venueName: null, city: null }).where).toBe('Online')
    })

    // An online event held somewhere as well keeps the place — a hybrid day
    // still has a room, and hiding it would strand anyone attending in person.
    it('keeps the venue of an online event that also has one', () => {
      expect(card({ isOnline: true }).where).toBe('BITEC, Bangkok')
    })

    it('says nothing rather than an empty comma when the place is unknown', () => {
      expect(card({ venueName: null, city: null }).where).toBe('—')
    })
  })

  describe('badge', () => {
    it('is null when the event is selling normally', () => {
      expect(card().badge).toBeNull()
    })

    it('labels a sold-out event for the waitlist', () => {
      expect(card({ badge: 'waitlist' }).badge).toEqual({ label: 'Waitlist', kind: 'waitlist' })
    })

    it('labels one that is nearly gone', () => {
      expect(card({ badge: 'selling_fast' }).badge).toEqual({
        label: 'Selling fast',
        kind: 'selling_fast',
      })
    })
  })

  describe('category', () => {
    // The type is the enum the API guarantees; categoryName is free text that
    // an event may simply not carry.
    it('falls back to the type when the event has no category', () => {
      expect(card({ categoryName: null, type: 'Seminar' }).category).toBe('Seminar')
    })
  })

  describe('href', () => {
    it('opens the landing template chosen for the type, carrying the slug', () => {
      expect(card({ type: 'Conference' }).href).toBe('/landing/aurora?event=tech-summit-2026')
      expect(card({ type: 'Concert & Festival' }).href).toBe(
        '/landing/atlas?event=tech-summit-2026',
      )
      expect(card({ type: 'Exhibition' }).href).toBe('/landing/noir?event=tech-summit-2026')
    })

    it('escapes a slug so it cannot break out of the query string', () => {
      expect(card({ slug: 'a b&c' }).href).toBe('/landing/aurora?event=a%20b%26c')
    })
  })

  describe('cover', () => {
    it('passes the image through when the event has one', () => {
      expect(card({ coverImage: 'https://cdn.test/x.jpg' }).cover).toBe('https://cdn.test/x.jpg')
    })

    // The kit filled every card from picsum. A real event without a cover shows
    // its type's gradient rather than a stranger's photograph.
    it('is null when it has none', () => {
      expect(card().cover).toBeNull()
    })
  })
})
