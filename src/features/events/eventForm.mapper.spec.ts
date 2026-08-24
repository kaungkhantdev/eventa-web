import { describe, expect, it } from 'vitest'
import {
  bahtOf,
  publishGaps,
  satangOf,
  toCreateBody,
  toEventFormValues,
  toUpdateBody,
  type EventFormValues,
} from './eventForm.mapper'
import type { EventWire } from './types'
import type { TicketWire } from '@/features/ticketing/ticketing.api'

const event = (over: Partial<EventWire> = {}): EventWire => ({
  id: 'evt-1',
  slug: 'tech-summit-2026',
  name: 'Tech Summit 2026',
  description: 'Two days of talks.',
  type: 'Conference',
  status: 'draft',
  bucket: 'active',
  startAt: '2026-07-18T02:00:00Z',
  endAt: '2026-07-19T11:00:00Z',
  venueName: 'BITEC',
  city: 'Bangkok',
  isOnline: false,
  capacity: 400,
  coverImage: 'https://cdn.eventa.test/cover.jpg',
  version: 3,
  ...over,
})

const ticket = (over: Partial<TicketWire> = {}): TicketWire => ({
  id: 'tkt-1',
  eventId: 'evt-1',
  name: 'Early Bird',
  isFree: false,
  priceSatang: 125_000,
  currency: 'THB',
  status: 'on_sale',
  sold: 0,
  total: 200,
  salesStartAt: null,
  salesEndAt: null,
  version: 1,
  ...over,
})

describe('baht on screen, satang on the wire', () => {
  it('converts what the organizer typed into integer satang', () => {
    expect(satangOf('1250')).toBe(125_000)
  })

  it('keeps the satang of a price with decimals', () => {
    expect(satangOf('1250.50')).toBe(125_050)
  })

  it('rounds rather than truncating a fraction of a satang', () => {
    expect(satangOf('0.005')).toBe(1)
  })

  it('treats an empty or nonsense price as no price at all, not as free', () => {
    // Sending 0 would create a paid tier costing nothing; the API prices a
    // genuinely free tier through `isFree` instead.
    expect(satangOf('')).toBeUndefined()
    expect(satangOf('abc')).toBeUndefined()
    expect(satangOf('-5')).toBeUndefined()
  })

  it('reads satang back as whole baht for the input', () => {
    expect(bahtOf(125_000)).toBe('1250')
    expect(bahtOf(125_050)).toBe('1250.5')
    expect(bahtOf(0)).toBe('0')
  })

  it('survives a round trip without drifting', () => {
    for (const price of ['1250', '0.5', '99999']) {
      expect(bahtOf(satangOf(price)!)).toBe(String(Number(price)))
    }
  })
})

describe('hydrating the wizard from an event being edited', () => {
  const values = () => toEventFormValues(event(), [ticket()], [{ text: '20+ speakers', icon: 'hgi-mic-01' }])

  it('fills the basics', () => {
    expect(values()).toMatchObject({
      name: 'Tech Summit 2026',
      description: 'Two days of talks.',
      type: 'Conference',
      venueName: 'BITEC',
      city: 'Bangkok',
    })
  })

  it('splits the start instant into a Bangkok date and time for the inputs', () => {
    // The wire is UTC; the two inputs are the wall clock the organizer set.
    expect(values().startDate).toBe('2026-07-18')
    expect(values().startTime).toBe('09:00')
  })

  it('leaves the end blank when the event has none', () => {
    const v = toEventFormValues(event({ endAt: null }), [], [])
    expect(v.endDate).toBe('')
    expect(v.endTime).toBe('')
  })

  it('prices each ticket row in baht', () => {
    expect(values().tickets[0]).toMatchObject({ name: 'Early Bird', price: '1250', quantity: '200' })
  })

  it('carries the version every save has to send back', () => {
    expect(values().version).toBe(3)
  })

  /**
   * `toUpdateBody` has always SENT `coverImage`, but nothing read it back — so
   * a saved cover vanished the moment the wizard was reopened, and the next
   * save wrote the empty string over it. A field that only travels one way is
   * worse than one that does not travel: it deletes.
   */
  it('reads the cover image back, so reopening the wizard does not erase it', () => {
    expect(values().coverImage).toBe('https://cdn.eventa.test/cover.jpg')
  })

  it('has no cover when the event has none', () => {
    expect(toEventFormValues(event({ coverImage: null }), [], []).coverImage).toBe('')
  })

  it('starts empty for a brand-new event', () => {
    const v = toEventFormValues(null, [], [])
    expect(v.name).toBe('')
    expect(v.tickets).toEqual([])
    expect(v.version).toBeNull()
  })
})

describe('what POST /events may carry', () => {
  const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
    ...toEventFormValues(null, [], []),
    name: 'Tech Summit 2026',
    type: 'Conference',
    startDate: '2026-07-18',
    startTime: '09:00',
    ...over,
  })

  it('sends the four fields the create endpoint accepts', () => {
    const body = toCreateBody(values({ description: 'Two days.' }))
    expect(body).toEqual({
      name: 'Tech Summit 2026',
      type: 'Conference',
      startAt: '2026-07-18T02:00:00.000Z',
      description: 'Two days.',
    })
  })

  it('reads the date and time as Bangkok, not as the browser’s zone', () => {
    // 09:00 in Bangkok is 02:00 UTC. Sending the browser's offset would move
    // every event by the viewer's distance from Thailand.
    expect(toCreateBody(values()).startAt).toBe('2026-07-18T02:00:00.000Z')
  })

  it('omits a description that was never written', () => {
    expect(toCreateBody(values())).not.toHaveProperty('description')
  })

  it('never sends the venue — the create endpoint rejects unknown fields', () => {
    const body = toCreateBody(values({ venueName: 'BITEC' }))
    expect(body).not.toHaveProperty('venueName')
  })
})

describe('what PATCH /events/:id may carry', () => {
  it('sends the fields the create call could not', () => {
    const body = toUpdateBody(toEventFormValues(event(), [], []))
    expect(body).toMatchObject({
      venueName: 'BITEC',
      city: 'Bangkok',
      isOnline: false,
      // 18:00 in Bangkok is 11:00 UTC — the same instant the fixture came in as.
      endAt: '2026-07-19T11:00:00.000Z',
      version: 3,
    })
  })

  it('sends an empty string to clear a venue, which the publish gate reads as missing', () => {
    const body = toUpdateBody(toEventFormValues(event({ venueName: null }), [], []))
    expect(body.venueName).toBe('')
  })

  it('clears the end date to null rather than leaving it stale', () => {
    const v = { ...toEventFormValues(event(), [], []), endDate: '', endTime: '' }
    expect(toUpdateBody(v).endAt).toBeNull()
  })

  it('leaves out contact and colour entirely, so a value set elsewhere survives', () => {
    // The API applies only the keys it is given. Sending '' "to be tidy" would
    // wipe a contact address the wizard never showed.
    const body = toUpdateBody(toEventFormValues(event(), [], []))
    expect(body).not.toHaveProperty('contactEmail')
    expect(body).not.toHaveProperty('accentColor')
  })

  it('gives back the exact instant it was handed, through the two inputs', () => {
    const body = toUpdateBody(toEventFormValues(event(), [], []))
    expect(body.startAt).toBe(new Date('2026-07-18T02:00:00Z').toISOString())
    expect(body.endAt).toBe(new Date('2026-07-19T11:00:00Z').toISOString())
  })

  it('sends an online event with no venue', () => {
    const v = { ...toEventFormValues(event(), [], []), isOnline: true, onlineNote: 'Zoom' }
    const body = toUpdateBody(v)
    expect(body.isOnline).toBe(true)
    expect(body.onlineNote).toBe('Zoom')
  })
})

describe('whether the event may be published yet', () => {
  it('is ready when it has a title, a description, a place and a ticket', () => {
    expect(publishGaps(toEventFormValues(event(), [ticket()], []))).toEqual([])
  })

  it('lists a missing description in the API’s own words', () => {
    const v = toEventFormValues(event({ description: null }), [ticket()], [])
    expect(publishGaps(v)).toContain('a description')
  })

  it('lists a missing title', () => {
    const v = { ...toEventFormValues(event(), [ticket()], []), name: '   ' }
    expect(publishGaps(v)).toContain('a title')
  })

  it('lists a missing place — unless the event is online', () => {
    const noVenue = toEventFormValues(event({ venueName: null }), [ticket()], [])
    expect(publishGaps(noVenue)).toContain('a venue or an online link')

    const online = toEventFormValues(event({ venueName: null, isOnline: true }), [ticket()], [])
    expect(publishGaps(online)).not.toContain('a venue or an online link')
  })

  it('lists missing tickets', () => {
    expect(publishGaps(toEventFormValues(event(), [], []))).toContain('at least one ticket type')
  })

  it('does not count a ticket the organizer has typed but not saved', () => {
    // Only tiers the API has stored satisfy the gate; an unsaved row in the
    // form would make the button green and the request fail.
    const v = toEventFormValues(event(), [], [])
    v.tickets.push({ id: null, name: 'VIP', price: '3500', quantity: '40', isFree: false })
    expect(publishGaps(v)).toContain('at least one ticket type')
  })

  it('reports every gap at once, so the checklist is complete', () => {
    const v = toEventFormValues(event({ description: null, venueName: null }), [], [])
    expect(publishGaps(v)).toHaveLength(3)
  })
})
