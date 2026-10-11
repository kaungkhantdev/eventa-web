import { describe, expect, it } from 'vitest'
import {
  toAttendeeRow,
  toEventHeader,
  toOverview,
  toRegistrationRow,
  toSessionDay,
  toSpeakerCard,
  toTicketRow,
  toneOf,
  endOf,
  withSeconds,
} from './eventDetail.mapper'
import type { EventOverviewWire, EventRegistrationWire } from './eventDetail.api'
import type { EventWire } from './types'
import type { SessionWire, SpeakerWire } from '@/features/program/program.api'
import type { TicketWire } from '@/features/ticketing/ticketing.api'
import { toTicketCard } from '@/features/ticketing/tickets.mapper'
import type { TicketWire as InventoryTicketWire } from '@/features/ticketing/tickets.types'
import type { TicketStatus } from '@/features/ticketing/types'

const event = (over: Partial<EventWire> = {}): EventWire => ({
  id: 'evt-1',
  slug: 'tech-summit-2026',
  name: 'Tech Summit 2026',
  description: 'Two days of talks.',
  type: 'Conference',
  status: 'upcoming',
  bucket: 'active',
  startAt: '2026-07-18T02:00:00Z',
  endAt: '2026-07-19T11:00:00Z',
  venueName: 'BITEC',
  city: 'Bangkok',
  isOnline: false,
  capacity: 400,
  version: 3,
  ...over,
})

describe('the event workspace header', () => {
  it('reads the date range on the Bangkok calendar', () => {
    const header = toEventHeader(event())
    expect(header.when).toContain('July 18')
    expect(header.when).toContain('09:00')
  })

  it('shows a single day when the event does not span one', () => {
    const header = toEventHeader(event({ endAt: null }))
    expect(header.when).toContain('July 18, 2026')
    expect(header.when).not.toContain('–')
  })

  it('names the venue and city together', () => {
    expect(toEventHeader(event()).where).toBe('BITEC, Bangkok')
  })

  /**
   * The hero shows the organizer's own cover or no photograph at all.
   *
   * It used to seed picsum.photos from the slug, which dressed every event in
   * a stranger's crowd — and went on doing so after a real cover was uploaded.
   */
  it('carries the event own cover image', () => {
    expect(toEventHeader(event({ coverImage: 'https://cdn.test/hero.jpg' })).cover).toBe(
      'https://cdn.test/hero.jpg',
    )
  })

  it('has no cover when the event has none', () => {
    expect(toEventHeader(event({ coverImage: null })).cover).toBeNull()
  })

  /**
   * The description the organizer wrote, shown back to them.
   *
   * The console never rendered it anywhere: the wizard demands one before it
   * will publish, the public landing page shows it to attendees, and the
   * organizer's own screen was the one place it could not be read.
   */
  it('carries the description', () => {
    expect(toEventHeader(event({ description: 'Two days of talks.' })).description).toBe(
      'Two days of talks.',
    )
  })

  it('has no description when the event has none', () => {
    expect(toEventHeader(event({ description: null })).description).toBeNull()
  })

  /** Whitespace-only is nothing to show, not a blank paragraph. */
  it('treats a blank description as none', () => {
    expect(toEventHeader(event({ description: '   ' })).description).toBeNull()
  })

  it('says "Online" for an online event rather than an empty venue', () => {
    const header = toEventHeader(event({ isOnline: true, venueName: null, city: null }))
    expect(header.where).toBe('Online')
  })

  it('falls back to the city alone when there is no venue name', () => {
    expect(toEventHeader(event({ venueName: null })).where).toBe('Bangkok')
  })

  it('leaves the location out entirely rather than printing a stray comma', () => {
    expect(toEventHeader(event({ venueName: null, city: null })).where).toBe('')
  })

  it('describes the status in the words the console uses', () => {
    expect(toEventHeader(event({ status: 'draft' })).status).toBe('Draft')
  })

  it('carries the version an edit needs', () => {
    expect(toEventHeader(event()).version).toBe(3)
  })
})

const overview = (over: Partial<EventOverviewWire> = {}): EventOverviewWire => ({
  registrations: 312,
  ticketsSold: 312,
  capacity: 400,
  fillPercent: 78,
  revenueSatang: 28_400_000,
  daysLeft: 7,
  publicUrl: 'https://eventa.co/e/tech-summit-2026',
  ...over,
})

describe('the overview tiles', () => {
  it('reads registrations against capacity', () => {
    expect(toOverview(overview()).registrations).toBe('312/400')
  })

  it('shows the count alone when no capacity is set', () => {
    expect(toOverview(overview({ capacity: null })).registrations).toBe('312')
  })

  it('formats revenue in baht', () => {
    expect(toOverview(overview()).revenue).toBe('฿284,000')
  })

  it('renders withheld revenue as a dash, never as zero', () => {
    // The API sends null when the caller lacks finView. "฿0" would state that
    // the event took no money, which is a different fact entirely.
    const tile = toOverview(overview({ revenueSatang: null }))
    expect(tile.revenue).toBe('—')
    expect(tile.revenue).not.toBe('฿0')
  })

  it('still says Free when an event genuinely took nothing', () => {
    expect(toOverview(overview({ revenueSatang: 0 })).revenue).toBe('Free')
  })

  it('trusts the API’s days-left rather than counting in the browser', () => {
    expect(toOverview(overview({ daysLeft: 7 })).daysLeft).toBe(7)
  })

  it('passes the public link through for the Copy button', () => {
    expect(toOverview(overview()).publicUrl).toBe('https://eventa.co/e/tech-summit-2026')
  })
})

const registration = (over: Partial<EventRegistrationWire> = {}): EventRegistrationWire => ({
  reference: 'ORD-2026-000045',
  attendeeName: 'Anong Pattana',
  tickets: 2,
  amountSatang: 350_000,
  paymentStatus: 'paid',
  registeredAt: '2026-07-02T03:24:00Z',
  ...over,
})

describe('a row of the registrations tab', () => {
  it('formats the amount in baht', () => {
    expect(toRegistrationRow(registration()).amount).toBe('฿3,500')
  })

  it('calls a free registration Free rather than ฿0', () => {
    expect(toRegistrationRow(registration({ amountSatang: 0 })).amount).toBe('Free')
  })

  it('stamps the Bangkok date and time', () => {
    const row = toRegistrationRow(registration())
    expect(row.date).toBe('Jul 2, 2026')
    expect(row.time).toBe('10:24')
  })

  it('title-cases the payment status', () => {
    expect(toRegistrationRow(registration({ paymentStatus: 'paid' })).status).toBe('Paid')
    expect(toRegistrationRow(registration({ paymentStatus: 'refunded' })).status).toBe('Refunded')
  })

  it('shows an unfamiliar status rather than a blank cell', () => {
    expect(toRegistrationRow(registration({ paymentStatus: 'chargeback' })).status).toBe(
      'Chargeback',
    )
  })

  it('derives the avatar initials from the attendee name', () => {
    expect(toRegistrationRow(registration()).initials).toBe('AP')
  })
})

describe('a row of the attendees tab', () => {
  it('carries the name, email and seat counts through', () => {
    const row = toAttendeeRow({
      name: 'Somchai Prasert',
      email: 'somchai@example.com',
      registrations: 2,
      seats: 3,
    })
    expect(row).toMatchObject({ name: 'Somchai Prasert', email: 'somchai@example.com', seats: 3 })
    expect(row.initials).toBe('SP')
  })
})

const speaker = (over: Partial<SpeakerWire> = {}): SpeakerWire => ({
  id: 'spk-1',
  eventId: 'evt-1',
  name: 'Dr. Anna Wong',
  role: 'Head of AI, Nimbus',
  email: 'anna@nimbus.co',
  phone: '02 555 0110',
  talkTitle: 'The State of AI in Southeast Asia',
  tag: 'Keynote',
  initials: 'AW',
  tone: 'green',
  rating: '4.8',
  sessionCount: 2,
  bio: null,
  photoUrl: null,
  website: null,
  version: 1,
  ...over,
})

describe('a speaker card', () => {
  it('shows the role the API stored', () => {
    expect(toSpeakerCard(speaker()).role).toBe('Head of AI, Nimbus')
  })

  it('leaves the role blank rather than printing null', () => {
    expect(toSpeakerCard(speaker({ role: null })).role).toBe('')
  })

  it('shows the talk and the label the organizer recorded', () => {
    const card = toSpeakerCard(speaker())
    expect(card.talk).toBe('The State of AI in Southeast Asia')
    expect(card.tag).toBe('Keynote')
  })

  it('leaves the talk and label blank rather than printing null', () => {
    const card = toSpeakerCard(speaker({ talkTitle: null, tag: null }))
    expect(card.talk).toBe('')
    expect(card.tag).toBe('')
  })

  it('counts their sessions in words', () => {
    expect(toSpeakerCard(speaker({ sessionCount: 1 })).sessions).toBe('1 session')
    expect(toSpeakerCard(speaker({ sessionCount: 2 })).sessions).toBe('2 sessions')
    expect(toSpeakerCard(speaker({ sessionCount: 0 })).sessions).toBe('No sessions yet')
  })
})

const session = (over: Partial<SessionWire> = {}): SessionWire => ({
  id: 'ses-1',
  eventId: 'evt-1',
  day: 1,
  startTime: '09:00:00',
  endTime: '09:45:00',
  title: 'Opening Keynote',
  type: 'Keynote',
  room: 'Hall A',
  color: 'green',
  description: '',
  sortOrder: 0,
  speakers: [{ id: 'spk-1', name: 'Dr. Anna Wong' }],
  version: 1,
  ...over,
})

describe('the agenda', () => {
  it('groups sessions into days, in order', () => {
    const days = toSessionDay([session({ id: 'b', day: 2 }), session({ id: 'a', day: 1 })])
    expect(days.map((d) => d.day)).toEqual([1, 2])
  })

  it('orders a day by the API’s sortOrder, then by start time', () => {
    const days = toSessionDay([
      session({ id: 'late', startTime: '11:00:00', sortOrder: 1 }),
      session({ id: 'early', startTime: '09:00:00', sortOrder: 0 }),
    ])
    expect(days[0]!.sessions.map((s) => s.id)).toEqual(['early', 'late'])
  })

  it('trims the seconds off a wall-clock time', () => {
    expect(toSessionDay([session()])[0]!.sessions[0]!.time).toBe('09:00')
  })

  it('states the length when the session has an end', () => {
    expect(toSessionDay([session()])[0]!.sessions[0]!.duration).toBe('45m')
  })

  it('spells a long session in hours and minutes', () => {
    const day = toSessionDay([session({ startTime: '09:00:00', endTime: '10:30:00' })])
    expect(day[0]!.sessions[0]!.duration).toBe('1h 30m')
  })

  it('leaves the length blank rather than guessing when there is no end time', () => {
    const day = toSessionDay([session({ endTime: '' })])
    expect(day[0]!.sessions[0]!.duration).toBe('')
  })

  it('names the speakers on the slot', () => {
    expect(toSessionDay([session()])[0]!.sessions[0]!.who).toBe('Dr. Anna Wong')
  })

  it('summarises a crowded panel rather than listing everyone', () => {
    const day = toSessionDay([
      session({
        speakers: [
          { id: '1', name: 'Mei Lin' },
          { id: '2', name: 'Raj Patel' },
          { id: '3', name: 'Tom Becker' },
        ],
      }),
    ])
    expect(day[0]!.sessions[0]!.who).toBe('Mei Lin +2')
  })

  it('says nothing when no room is set', () => {
    expect(toSessionDay([session({ room: '' })])[0]!.sessions[0]!.room).toBe('')
  })
})

const ticket = (over: Partial<TicketWire> = {}): TicketWire => ({
  id: 'tkt-1',
  eventId: 'evt-1',
  name: 'Early Bird',
  isFree: false,
  priceSatang: 125_000,
  currency: 'THB',
  // `onsale`, not `on_sale`: the stored value has no underscore. The old
  // fixture's did, which made a mechanical derivation of the label look right
  // here while production printed "Onsale".
  status: 'onsale',
  sold: 180,
  total: 200,
  salesStartAt: null,
  salesEndAt: null,
  version: 1,
  ...over,
})

/**
 * The same tier as the ticket inventory reads it. `/events/:id/tickets` and the
 * inventory's own endpoint publish one `TicketResponseDto`, but each feature
 * types the half it uses, so the agreement test needs both shapes.
 */
const inventoryTicket = (over: Partial<InventoryTicketWire> = {}): InventoryTicketWire => ({
  id: 'tkt-1',
  eventId: 'evt-1',
  eventName: 'Tech Summit 2026',
  name: 'Early Bird',
  isFree: false,
  priceSatang: 125_000,
  vatRate: 7,
  status: 'onsale',
  sold: 180,
  total: 200,
  maxPerOrder: 10,
  salesStartAt: null,
  salesEndAt: null,
  version: 1,
  ...over,
})

describe('a row of the tickets tab', () => {
  it('prices the tier in baht', () => {
    expect(toTicketRow(ticket()).price).toBe('฿1,250')
  })

  it('calls a free tier Free', () => {
    expect(toTicketRow(ticket({ isFree: true, priceSatang: 0 })).price).toBe('Free')
  })

  it('reads sold against the allocation', () => {
    const row = toTicketRow(ticket())
    expect(row.allocation).toBe('180/200')
    expect(row.soldPercent).toBe(90)
  })

  it('shows the count alone for an unlimited tier, never "12/0"', () => {
    // `total: 0` is the API's "unlimited"; a zero denominator would read as an
    // allocation of nothing that has somehow sold twelve.
    const row = toTicketRow(ticket({ total: 0, sold: 12 }))
    expect(row.allocation).toBe('12')
    expect(row.soldPercent).toBe(0)
  })

  it('reports no revenue figure — the API does not send one per tier', () => {
    // sold × price would ignore discounts and refunds, so it is not revenue.
    expect(toTicketRow(ticket())).not.toHaveProperty('revenue')
  })

  /**
   * Every value the `ticket_status` pgEnum (`eventa-api/src/db/schema/enums.ts`)
   * can store, and so every value a tier can arrive with.
   *
   * Literals rather than a list derived from `TicketStatus`, because that union
   * is the thing that drifts from the API — derived from it, this list would
   * only ever test itself. `satisfies` ties the two together, so a value the
   * API adds cannot be listed here without the union being widened too.
   */
  const API_TICKET_STATUSES = [
    'onsale',
    'scheduled',
    'paused',
    'soldout',
  ] as const satisfies readonly TicketStatus[]

  /** The words the ticketing page prints, which are the house wording. */
  const HOUSE_LABEL: Record<TicketStatus, string> = {
    onsale: 'On sale',
    scheduled: 'Scheduled',
    paused: 'Paused',
    soldout: 'Sold out',
  }

  it.each(API_TICKET_STATUSES)('calls a %s tier what the house calls it', (status) => {
    expect(toTicketRow(ticket({ status })).status).toBe(HOUSE_LABEL[status])
  })

  // The two screens are the real assertion. This panel and the ticketing page
  // show the same tier, so a tier badged "On sale" over there cannot be badged
  // "Onsale" here — and pinning the words twice would let somebody reword the
  // ticketing page and leave this one behind without a red test.
  it.each(API_TICKET_STATUSES)('agrees with the ticketing page about %s', (status) => {
    expect(toTicketRow(ticket({ status })).status).toBe(
      toTicketCard(inventoryTicket({ status })).statusLabel,
    )
  })

  // A value this build has never been taught still has to read as something,
  // and the API's own word is the honest guess. Spelled with an underscore
  // because that is how the database spells its other ticket enums
  // (`issued_ticket_status` has `checked_in`), so it is how a fifth
  // `ticket_status` would most likely arrive — and because a hyphen passes
  // whether or not the fallback spaces the value out at all, which is what the
  // assertion here is for. "Sales_ended" is not a word to print at anybody.
  it('spaces out an unknown status rather than printing its underscores', () => {
    expect(toTicketRow(ticket({ status: 'sales_ended' })).status).toBe('Sales ended')
  })
})

describe('avatar tints', () => {
  it('gives the same person the same colour every time', () => {
    expect(toneOf('Anong Pattana')).toBe(toneOf('Anong Pattana'))
  })

  it('only ever returns a tone the design system has', () => {
    const tones = ['brand', 'blue', 'pink', 'amber', 'violet']
    for (const name of ['A', 'Somchai Prasert', 'X Æ A-12', '한지민', '']) {
      expect(tones).toContain(toneOf(name))
    }
  })
})

describe('turning a planned duration into an end time', () => {
  it('adds the minutes the organizer chose', () => {
    expect(endOf('09:00', 45)).toBe('09:45')
  })

  it('carries into the next hour', () => {
    expect(endOf('09:30', 45)).toBe('10:15')
  })

  it('clamps at the end of the day rather than wrapping to the morning', () => {
    // A 23:30 session running 90 minutes would otherwise come back as 01:00,
    // which the API would store as ending before it started.
    expect(endOf('23:30', 90)).toBe('23:59')
  })

  it('gives the API the seconds it stores', () => {
    expect(withSeconds('09:00')).toBe('09:00:00')
    expect(withSeconds('09:00:00')).toBe('09:00:00')
  })
})
