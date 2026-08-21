import { describe, expect, it } from 'vitest'
import { toCalendarEvents, toEventRow, toUpcomingCard } from './events.mapper'
import type { EventListItemWire, EventWire, UpcomingEventWire } from './types'

const event = (over: Partial<EventListItemWire> = {}): EventListItemWire => ({
  id: 'evt-1',
  slug: 'tech-innovators-forum',
  name: 'Tech Innovators Forum',
  description: null,
  type: 'Conference',
  status: 'upcoming',
  bucket: 'active',
  startAt: '2025-08-27T02:00:00Z',
  endAt: null,
  venueName: null,
  city: null,
  isOnline: false,
  capacity: 50,
  version: 1,
  registrations: 39,
  fillPercent: 78,
  ...over,
})

describe('an event as the organizer’s table shows it', () => {
  it('spells the start date out on the Bangkok calendar', () => {
    expect(toEventRow(event()).date).toBe('August 27, 2025')
  })

  it('reads registrations as sold-over-capacity', () => {
    expect(toEventRow(event()).registrations).toBe('39/50')
  })

  it('shows the count alone when the event has no capacity', () => {
    // The list row carries no ticket allocation, so there is no denominator to
    // print. "39" is true; inventing one from fillPercent would not be.
    const row = toEventRow(event({ capacity: null, registrations: 39, fillPercent: 78 }))
    expect(row.registrations).toBe('39')
    expect(row.registrations).not.toContain('/')
  })

  it('takes the fill from the API rather than recomputing it', () => {
    // The API divides by the effective capacity — the event's headcount, else
    // the sum of ticket quantities — which this row cannot see. Recomputing
    // 39/50 here would quietly disagree with it.
    expect(toEventRow(event({ fillPercent: 62 })).fillPercent).toBe(62)
  })

  it('gives every stored status the console’s own word', () => {
    const labelOf = (status: EventListItemWire['status']) => toEventRow(event({ status })).status
    expect(labelOf('draft')).toBe('Draft')
    expect(labelOf('planned')).toBe('Planned')
    expect(labelOf('upcoming')).toBe('Upcoming')
    expect(labelOf('live')).toBe('Live')
    expect(labelOf('completed')).toBe('Completed')
    expect(labelOf('cancelled')).toBe('Cancelled')
  })

  it('dresses the row by its type', () => {
    const row = toEventRow(event({ type: 'Workshop' }))
    expect(row.icon).toBe('hgi-briefcase-01')
    expect(row.tone).toBe('teal')
  })

  it('still renders an event type it has never heard of', () => {
    // A type added to the API before this app knows about it must not blank
    // the row out — it falls back to a neutral calendar icon.
    const row = toEventRow(event({ type: 'Hackathon' as EventListItemWire['type'] }))
    expect(row.icon).toBeTruthy()
    expect(row.tone).toBe('brand')
  })

  it('carries the id and version an action needs', () => {
    const row = toEventRow(event({ id: 'evt-9', version: 4 }))
    expect(row.id).toBe('evt-9')
    expect(row.version).toBe(4)
  })

  it('seeds the cover image from the slug, so it is stable across renders', () => {
    expect(toEventRow(event()).seed).toBe('tech-innovators-forum')
  })
})

const upcoming = (over: Partial<UpcomingEventWire> = {}): UpcomingEventWire => ({
  id: 'evt-2',
  name: 'UX Bangkok Meetup',
  slug: 'ux-bangkok-meetup',
  type: 'Networking',
  status: 'upcoming',
  startAt: '2026-09-04T11:00:00Z',
  daysLeft: 5,
  sold: 72,
  capacity: 90,
  fillPercent: 80,
  ...over,
})

describe('an event on the upcoming grid', () => {
  it('trusts the API’s days-left rather than counting in the browser', () => {
    // The countdown is whole Bangkok days. A viewer in London subtracting
    // dates locally would be a day out for seven hours of every day.
    expect(toUpcomingCard(upcoming({ daysLeft: 5 })).daysLeft).toBe(5)
  })

  it('reads registrations as sold-over-capacity', () => {
    expect(toUpcomingCard(upcoming()).registrations).toBe('72/90')
  })

  it('keeps the sold count on its own for the attendee line', () => {
    expect(toUpcomingCard(upcoming()).sold).toBe(72)
  })

  it('takes the fill from the API', () => {
    expect(toUpcomingCard(upcoming({ fillPercent: 33 })).fillPercent).toBe(33)
  })

  it('dresses the card by its type', () => {
    expect(toUpcomingCard(upcoming()).tone).toBe('indigo')
  })
})

const wire = (over: Partial<EventWire> = {}): EventWire => ({
  id: 'evt-3',
  slug: 'weekly-standup',
  name: 'Weekly standup',
  description: null,
  type: 'Networking',
  status: 'planned',
  bucket: 'active',
  startAt: '2026-09-04T02:30:00Z',
  endAt: null,
  venueName: null,
  city: null,
  isOnline: false,
  capacity: null,
  version: 1,
  ...over,
})

describe('a month of events on the calendar', () => {
  it('files each event under its Bangkok day', () => {
    expect(toCalendarEvents([wire()])[0]!.day).toBe('2026-09-04')
  })

  it('files a late-evening event under the Bangkok day, not the UTC one', () => {
    // 20:00 UTC on the 4th is 03:00 on the 5th in Bangkok — a different square.
    const [event] = toCalendarEvents([wire({ startAt: '2026-09-04T20:00:00Z' })])
    expect(event!.day).toBe('2026-09-05')
    expect(event!.time).toBe('03:00')
  })

  it('shows the Bangkok wall clock, zero-padded so the column lines up', () => {
    expect(toCalendarEvents([wire()])[0]!.time).toBe('09:30')
  })

  it('orders a day’s events by time', () => {
    const events = toCalendarEvents([
      wire({ id: 'b', startAt: '2026-09-04T08:00:00Z' }),
      wire({ id: 'a', startAt: '2026-09-04T02:30:00Z' }),
    ])
    expect(events.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('dresses each pill by the event’s type', () => {
    expect(toCalendarEvents([wire({ type: 'Conference' })])[0]!.tone).toBe('amber')
  })
})
