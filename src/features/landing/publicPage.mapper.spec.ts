import { describe, expect, it } from 'vitest'
import { toLandingEvent } from './publicPage.mapper'
import type { PublicPageWire, PublicTicketWire } from './publicPage.types'

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
    accentColor: '#1ba770',
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
