import { describe, expect, it } from 'vitest'
import { swatchClassOf } from '@/lib/seatSwatches'
import { toLandingEvent } from './publicPage.mapper'
import type { PublicPageWire, PublicSeatMapWire, PublicTicketWire } from './publicPage.types'

const ticket = (over: Partial<PublicTicketWire> = {}): PublicTicketWire => ({
  id: 't-1',
  name: 'General admission',
  priceLabel: '฿890',
  priceSatang: 89_000,
  isFree: false,
  includes: ['Entry', 'Race pack'],
  isRecommended: false,
  badge: null,
  soldOut: false,
  urgency: null,
  canRegister: true,
  ...over,
})

const page = (over: Partial<PublicPageWire> = {}): PublicPageWire => ({
  event: {
    id: 'e-1',
    slug: 'bangkok-trail-run-2026',
    name: 'Bangkok Trail Run 2026',
    description: 'A 21km trail run through Bang Krachao.',
    type: 'Sports',
    categoryName: 'Running',
    startAt: '2026-11-13T23:00:00.000Z',
    endAt: null,
    timezone: 'Asia/Bangkok',
    isOnline: false,
    onlineNote: null,
    venueName: 'Bang Krachao',
    venueAddress: '1 Phra Pradaeng',
    city: 'Samut Prakan',
    coverImage: null,
    accentColor: '#00c066',
    organizerName: 'Eventa Co.',
    template: 'noir',
    locale: 'en',
    ...over.event,
  },
  highlights: [],
  agenda: [],
  speakers: [],
  tickets: [ticket()],
  faqs: [],
  seatMap: null,
  registration: { open: true, reason: null },
  sections: { agenda: 'Agenda', speakers: 'Speakers' },
  share: {
    title: 'Bangkok Trail Run 2026',
    description: 'A 21km trail run.',
    image: null,
    url: 'https://eventa.test/e/bangkok-trail-run-2026',
    noIndex: false,
  },
  ...over,
})

describe('the price the page leads with', () => {
  it('takes the cheapest tier, comparing satang and never a formatted string', () => {
    const p = page({
      tickets: [
        ticket({ id: 'a', priceSatang: 107_000, priceLabel: '฿1,070' }),
        ticket({ id: 'b', priceSatang: 50_000, priceLabel: '฿500' }),
      ],
    })
    expect(toLandingEvent(p).priceFrom).toBe('฿500')
  })

  it('says Free rather than ฿0 when the cheapest tier is free', () => {
    const p = page({ tickets: [ticket({ isFree: true, priceSatang: 0, priceLabel: 'Free' })] })
    expect(toLandingEvent(p).priceFrom).toBe('Free')
  })

  it('shows a dash when the event has no tiers at all', () => {
    // "No price yet" and "free" are different facts, and neither is ฿0.
    expect(toLandingEvent(page({ tickets: [] })).priceFrom).toBe('—')
  })

  // A sold-out free tier beside a paid one made the page lead with "Free"
  // when nothing free could be had. The headline is what somebody can buy.
  it('ignores a tier nobody can register for', () => {
    const p = page({
      tickets: [
        ticket({ id: 'a', isFree: true, priceSatang: 0, priceLabel: 'Free', soldOut: true, canRegister: false }),
        ticket({ id: 'b', priceSatang: 150_000, priceLabel: '฿1,500' }),
      ],
    })
    expect(toLandingEvent(p).priceFrom).toBe('฿1,500')
  })

  // Sold out is still a price the page should name; "—" would read as unpriced.
  it('falls back to the cheapest tier when none can be registered for', () => {
    const p = page({
      tickets: [ticket({ priceSatang: 150_000, priceLabel: '฿1,500', soldOut: true, canRegister: false })],
    })
    expect(toLandingEvent(p).priceFrom).toBe('฿1,500')
  })

  it('carries each tier’s price straight from the API’s own label', () => {
    // The server already applies the Free / RSVP sentinels the templates
    // branch on; re-deriving them here would be a second source of truth.
    const p = page({ tickets: [ticket({ priceLabel: 'RSVP', priceSatang: 0, isFree: false })] })
    expect(toLandingEvent(p).tickets[0].price).toBe('RSVP')
    expect(toLandingEvent(p).priceFrom).toBe('RSVP')
  })
})

describe('the ticket tiers', () => {
  it('orders them cheapest first — the API orders by id', () => {
    const p = page({
      tickets: [
        ticket({ id: 'a', name: 'VIP', priceSatang: 300_000 }),
        ticket({ id: 'b', name: 'Early', priceSatang: 50_000 }),
      ],
    })
    expect(toLandingEvent(p).tickets.map((t) => t.name)).toEqual(['Early', 'VIP'])
  })

  it('features only the first recommended tier', () => {
    // Two lifted cards would break the grid's single accent.
    const p = page({
      tickets: [
        ticket({ id: 'a', priceSatang: 100, isRecommended: true }),
        ticket({ id: 'b', priceSatang: 200, isRecommended: true }),
      ],
    })
    expect(toLandingEvent(p).tickets.map((t) => t.featured)).toEqual([true, false])
  })

  it('says Sold out ahead of any badge or urgency', () => {
    const p = page({ tickets: [ticket({ soldOut: true, badge: 'Best value', urgency: 'Only 3' })] })
    expect(toLandingEvent(p).tickets[0].note).toBe('Sold out')
  })

  it('prefers a badge to an urgency sentence', () => {
    const p = page({ tickets: [ticket({ badge: 'Best value', urgency: 'Only 3 left' })] })
    expect(toLandingEvent(p).tickets[0].note).toBe('Best value')
  })

  it('shows the API’s urgency sentence verbatim when there is no badge', () => {
    // The server writes the whole sentence and sends no count of its own.
    const p = page({ tickets: [ticket({ urgency: 'Going fast — only 3 left' })] })
    expect(toLandingEvent(p).tickets[0].note).toBe('Going fast — only 3 left')
  })

  it('carries what a tier includes', () => {
    expect(toLandingEvent(page()).tickets[0].features).toEqual(['Entry', 'Race pack'])
  })
})

describe('when the event happens', () => {
  it('renders the date in the event’s own timezone, not the reader’s', () => {
    // 23:00 UTC on the 13th is already the 14th in Bangkok.
    expect(toLandingEvent(page()).dateText).toContain('Nov 14')
  })

  it('always writes a four-digit year', () => {
    // MinimalPage regex-parses dateText for its footer © year and silently
    // falls back to the browser's year without one.
    expect(toLandingEvent(page()).dateText).toMatch(/\b20\d{2}\b/)
  })

  it('spans a multi-day event as one range', () => {
    const p = page({ event: { ...page().event, endAt: '2026-11-15T10:00:00.000Z' } })
    const text = toLandingEvent(p).dateText
    expect(text).toContain('Nov 14')
    expect(text).toContain('Nov 15')
    expect(text).toMatch(/\b2026\b/)
  })

  it('shows a single start when the event has no end', () => {
    expect(toLandingEvent(page()).timeText).toBe('06:00')
  })

  it('shows a time range when it has one', () => {
    const p = page({ event: { ...page().event, endAt: '2026-11-14T10:00:00.000Z' } })
    expect(toLandingEvent(p).timeText).toBe('06:00 – 17:00')
  })
})

describe('the agenda', () => {
  const withAgenda = (over = {}) =>
    page({
      agenda: [
        {
          title: 'Registration opens',
          day: 1,
          startTime: '05:30:00',
          endTime: '06:00:00',
          type: 'Session',
          room: 'Start line',
          speakerNames: ['Anong Pattana'],
          ...over,
        },
      ],
    })

  it('trims the seconds off a Postgres time', () => {
    expect(toLandingEvent(withAgenda()).agenda[0].time).toBe('05:30 – 06:00')
  })

  it('never re-converts an agenda time — it is already the event’s wall clock', () => {
    // These are Postgres `time` values with no date and no zone. Treating them
    // as instants would shift a real agenda by hours.
    const p = withAgenda()
    p.event.timezone = 'America/New_York'
    expect(toLandingEvent(p).agenda[0].time).toBe('05:30 – 06:00')
  })

  it('shows only the start when a session has no end', () => {
    expect(toLandingEvent(withAgenda({ endTime: null })).agenda[0].time).toBe('05:30')
  })

  it('describes a session by its room and speakers', () => {
    expect(toLandingEvent(withAgenda()).agenda[0].desc).toBe('Start line · Anong Pattana')
  })

  it('leaves the description empty rather than printing a stray separator', () => {
    const row = toLandingEvent(withAgenda({ room: null, speakerNames: [] })).agenda[0]
    expect(row.desc).toBe('')
  })
})

describe('a real event is emptier than the demo data', () => {
  it('survives having no agenda, speakers, highlights or FAQs', () => {
    const ev = toLandingEvent(page())
    expect(ev.agenda).toEqual([])
    expect(ev.speakers).toEqual([])
    expect(ev.highlights).toEqual([])
    expect(ev.faqs).toEqual([])
  })

  it('invents no social proof — the API counts no attendees', () => {
    // Templates guard these; a fabricated "1,500+ attendees" on a real event
    // would be a lie printed on the organizer's public page.
    const ev = toLandingEvent(page())
    expect(ev.attendeesText).toBe('')
    expect(ev.seatsLeft).toBe(0)
  })

  it('offers no contact or socials the API does not hold', () => {
    const ev = toLandingEvent(page())
    expect(ev.contactEmail).toBe('')
    expect(ev.socials).toEqual({})
  })

  it('falls back to the event type when it has no category', () => {
    const p = page({ event: { ...page().event, categoryName: null } })
    expect(toLandingEvent(p).category).toBe('Sports')
  })

  it('describes an online event by its note instead of a venue', () => {
    const p = page({
      event: { ...page().event, isOnline: true, onlineNote: 'Zoom link emailed', venueName: null },
    })
    const ev = toLandingEvent(p)
    expect(ev.online).toBe(true)
    expect(ev.onlineNote).toBe('Zoom link emailed')
    expect(ev.venue).toBe('')
  })
})

describe('the rest of the page', () => {
  it('names the event and its organizer', () => {
    const ev = toLandingEvent(page())
    expect(ev.title).toBe('Bangkok Trail Run 2026')
    expect(ev.organizer).toBe('Eventa Co.')
    expect(ev.slug).toBe('bangkok-trail-run-2026')
  })

  it('uses the description as the about text', () => {
    expect(toLandingEvent(page()).about).toBe('A 21km trail run through Bang Krachao.')
  })

  /**
   * The kit's templates have two slots — a one-line hook in the hero and the
   * full description under "About the event" — and its sample data fills them
   * with different sentences. The API has only `description`, and this filled
   * BOTH with it, so every public page printed the same paragraph twice,
   * once above the Register button and again fifty pixels below it.
   *
   * Shown once, in the section named for it. Inventing a hook by cutting the
   * first sentence would still repeat that sentence verbatim; a hero line
   * needs a field of its own before it can say anything a reader has not
   * already read.
   */
  it('does not repeat the description as a hero tagline', () => {
    expect(toLandingEvent(page()).tagline).toBe('')
  })

  it('leaves the about text empty rather than printing null', () => {
    const p = page({ event: { ...page().event, description: null } })
    expect(toLandingEvent(p).about).toBe('')
  })

  it('takes the section headings the API chose', () => {
    const p = page({ sections: { agenda: 'Race day', speakers: 'Pacers' } })
    expect(toLandingEvent(p).agendaTitle).toBe('Race day')
    expect(toLandingEvent(p).speakersTitle).toBe('Pacers')
  })

  it('sends registration to the portal for this event', () => {
    expect(toLandingEvent(page()).registerUrl).toBe('/portal/checkout?event=bangkok-trail-run-2026')
  })

  it('replaces a missing highlight icon rather than rendering tofu', () => {
    // A wrong or empty Hugeicons slug renders as a CJK box, not as nothing.
    const p = page({ highlights: [{ text: '21km route', icon: null }] })
    expect(toLandingEvent(p).highlights[0].icon).toMatch(/^hgi-/)
    expect(toLandingEvent(p).highlights[0].label).toBe('21km route')
  })

  it('derives speaker initials when the API sends none', () => {
    const p = page({
      speakers: [{ name: 'Anong Pattana', role: null, talkTitle: null, initials: null, tone: null }],
    })
    const speaker = toLandingEvent(p).speakers[0]
    expect(speaker.initials).toBe('AP')
    expect(speaker.role).toBe('')
  })

  it('prefers the talk title to the job role, which is what the page is about', () => {
    const p = page({
      speakers: [
        { name: 'Anong Pattana', role: 'Coach', talkTitle: 'Pacing a 21k', initials: null, tone: null },
      ],
    })
    expect(toLandingEvent(p).speakers[0].role).toBe('Pacing a 21k')
  })
})

/**
 * US-PAGE-05: a reserved event whose seats have ticket types shows how the
 * room is split — a seat map coloured seat by seat with a key, and each ticket
 * naming where its seats are (US-EVT-05 gives rows, or single seats, a type).
 */
describe('the seat map', () => {
  type WireRow = PublicSeatMapWire['rows'][number]

  /** A row whose every seat has one type, as the API sends it. */
  const wholeRow = (label: string, ticketTypeId: string | null, seats: number): WireRow => ({
    label,
    ticketTypeId,
    seatTicketTypes: Array(seats).fill(ticketTypeId),
  })

  /** Rows front to back, each given one type for all its seats. */
  const rowsOf = (types: (string | null)[], seatsPerRow = 16): WireRow[] =>
    types.map((type, i) => wholeRow(String(i + 1), type, seatsPerRow))

  const TICKETS = [
    ticket({ id: 'vip', name: 'VIP', priceSatang: 300_000, priceLabel: '฿3,000' }),
    ticket({ id: 'normal', name: 'Normal', priceSatang: 50_000, priceLabel: '฿500' }),
    ticket({ id: 'free', name: 'Free', priceSatang: 0, priceLabel: 'Free', isFree: true }),
  ]

  const withRows = (rows: WireRow[], seatsPerRow = 16): Partial<PublicPageWire> => ({
    tickets: TICKETS,
    seatMap: { seatsPerRow, rows },
  })

  const split = (types: (string | null)[], seatsPerRow = 16) => withRows(rowsOf(types, seatsPerRow), seatsPerRow)

  /** Row 7 split: seats 1–5 Free, 6–16 Normal — the API sends the row no single type. */
  const splitRow: WireRow = {
    label: '7',
    ticketTypeId: null,
    seatTicketTypes: [...Array(5).fill('free'), ...Array(11).fill('normal')],
  }

  const theatre = split(['vip', 'vip', 'normal', 'normal', 'normal', 'normal', 'free'])

  /** The owner's mock-up: rows 1–2 VIP, 3–6 Normal, row 7 seats 1–5 Free and 6–16 Normal. */
  const mixed = withRows([...rowsOf(['vip', 'vip', 'normal', 'normal', 'normal', 'normal']), splitRow])

  const rowsLabels = (over: Partial<PublicPageWire>) =>
    Object.fromEntries(toLandingEvent(page(over)).tickets.map((t) => [t.name, t.rowsLabel]))

  describe('where each ticket’s seats are', () => {
    it('names a run of rows as one range, and a single row on its own', () => {
      expect(rowsLabels(theatre)).toEqual({ Free: 'Row 7', Normal: 'Rows 3–6', VIP: 'Rows 1–2' })
    })

    it('lists rows split by another type’s as separate ranges', () => {
      expect(rowsLabels(split(['vip', 'normal', 'vip', 'vip'])).VIP).toBe('Rows 1, 3–4')
    })

    it('names the seats a ticket holds of a row split between tickets', () => {
      expect(rowsLabels(mixed)).toEqual({
        Free: 'Row 7 seats 1–5',
        Normal: 'Rows 3–6, row 7 seats 6–16',
        VIP: 'Rows 1–2',
      })
    })

    it('says nothing for a ticket that sells no seats', () => {
      expect(rowsLabels(split(['vip', 'vip'])).Normal).toBeNull()
    })

    it('says nothing for any ticket when the event has no seat map', () => {
      expect(rowsLabels({ ...theatre, seatMap: null })).toEqual({ Free: null, Normal: null, VIP: null })
    })
  })

  describe('the map', () => {
    it('is absent for an event without one — general admission, online, an untyped map', () => {
      expect(toLandingEvent(page()).seatMap).toBeNull()
    })

    it('keeps every row, front to back, with every seat', () => {
      const map = toLandingEvent(page(theatre)).seatMap
      expect(map?.rows.map((row) => row.label)).toEqual(['1', '2', '3', '4', '5', '6', '7'])
      expect(map?.rows.every((row) => row.swatches.length === 16)).toBe(true)
    })

    it('keys each ticket that sells seats, in the page’s ticket order, with where they are and how many', () => {
      expect(toLandingEvent(page(theatre)).seatMap?.legend.map((entry) => entry.label)).toEqual([
        'Free · Row 7 · 16 seats',
        'Normal · Rows 3–6 · 64 seats',
        'VIP · Rows 1–2 · 32 seats',
      ])
    })

    it('keys a row split between tickets seat by seat', () => {
      expect(toLandingEvent(page(mixed)).seatMap?.legend.map((entry) => entry.label)).toEqual([
        'Free · Row 7 seats 1–5 · 5 seats',
        'Normal · Rows 3–6, row 7 seats 6–16 · 75 seats',
        'VIP · Rows 1–2 · 32 seats',
      ])
    })

    it('counts a single seat as one seat', () => {
      expect(toLandingEvent(page(split(['free'], 1))).seatMap?.legend[0].label).toBe('Free · Row 1 · 1 seat')
    })

    it('groups a large seat count', () => {
      const rows = Array.from({ length: 100 }, () => 'vip')
      expect(toLandingEvent(page(split(rows, 40))).seatMap?.legend[0].label).toBe('VIP · Rows 1–100 · 4,000 seats')
    })

    it('leaves a ticket that sells no seats out of the key', () => {
      const labels = toLandingEvent(page(split(['vip', 'vip']))).seatMap?.legend.map((entry) => entry.label)
      expect(labels).toEqual(['VIP · Rows 1–2 · 32 seats'])
    })

    // The wizard colours a type by its place in its ticket list, which is in
    // the order the types were created; the API sends tickets in that order.
    // Colouring by the page's price order instead swapped VIP's and Free's
    // colours between the organizer's preview and this page.
    it('colours each ticket’s seats by the order the tickets were created, not by price', () => {
      const map = toLandingEvent(page(theatre)).seatMap
      expect(map?.rows.map((row) => row.swatches[0])).toEqual([0, 0, 1, 1, 1, 1, 2])
      expect(map?.legend.map((entry) => entry.swatch)).toEqual([2, 1, 0])
    })

    it('colours a row split between tickets seat by seat', () => {
      const row7 = toLandingEvent(page(mixed)).seatMap?.rows[6]
      expect(row7?.swatches).toEqual([...Array(5).fill(2), ...Array(11).fill(1)])
    })

    it('keeps a ticket’s colour when one created before it sells no seats', () => {
      // Normal sells no seats but still holds the second colour, as in the wizard.
      const map = toLandingEvent(page(split(['vip', 'free']))).seatMap
      expect(map?.rows.map((row) => row.swatches[0])).toEqual([0, 2])
      expect(map?.legend.map((entry) => entry.swatch)).toEqual([2, 0])
    })

    it('starts the colours again once every colour is used', () => {
      const tickets = Array.from({ length: 6 }, (_, i) => ticket({ id: `t${i}`, name: `Tier ${i}`, priceSatang: i }))
      const map = toLandingEvent(
        page({ tickets, seatMap: { seatsPerRow: 4, rows: rowsOf(tickets.map((t) => t.id), 4) } }),
      ).seatMap
      const first = (row: number) => swatchClassOf(map?.rows[row].swatches[0] ?? null)
      expect(first(5)).toBe(first(0))
      expect(first(1)).not.toBe(first(0))
    })

    it('leaves a seat with no ticket type neutral, and out of the key', () => {
      const map = toLandingEvent(page(split(['vip', null]))).seatMap
      expect(map?.rows[1].swatches.every((swatch) => swatch === null)).toBe(true)
      expect(map?.legend).toHaveLength(1)
    })

    // A type the page does not show — not public — names nothing a reader can buy.
    it('leaves a seat whose ticket is not on the page neutral, and out of the key', () => {
      const map = toLandingEvent(page(split(['vip', 'staff-only']))).seatMap
      expect(map?.rows[1].swatches.every((swatch) => swatch === null)).toBe(true)
      expect(map?.legend.map((entry) => entry.label)).toEqual(['VIP · Row 1 · 16 seats'])
    })

    it('is shown when only part of a row has a ticket type', () => {
      const partly: WireRow = { label: '1', ticketTypeId: null, seatTicketTypes: ['vip', 'vip', null, null] }
      const map = toLandingEvent(page(withRows([partly, wholeRow('2', null, 4)], 4))).seatMap
      expect(map?.rows[0].swatches).toEqual([0, 0, null, null])
      expect(map?.legend.map((entry) => entry.label)).toEqual(['VIP · Row 1 seats 1–2 · 2 seats'])
    })

    it('is absent when no ticket on the page sells a seat — it would show no split', () => {
      expect(toLandingEvent(page(split(['staff-only', null]))).seatMap).toBeNull()
    })

    it('sums up the split for a screen reader, one ticket at a time', () => {
      expect(toLandingEvent(page(theatre)).seatMap?.summary).toBe(
        'Seat map: Free row 7; Normal rows 3–6; VIP rows 1–2',
      )
      expect(toLandingEvent(page(mixed)).seatMap?.summary).toBe(
        'Seat map: Free row 7 seats 1–5; Normal rows 3–6, row 7 seats 6–16; VIP rows 1–2',
      )
    })
  })
})
