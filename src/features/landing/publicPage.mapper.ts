import { MASKED, bangkokDate, bangkokTime, initials } from '@/lib/format'
import { seatKeyLabelOf, seatsOfType, seatsWhereOf, seatsWherePhraseOf, type SeatRowTypes } from '@/lib/seatPlaces'
import { swatchOf } from '@/lib/seatSwatches'
import type { LandingEvent, LandingSeatMap, LandingSpeaker, LandingTicket } from './types'
import type {
  PublicPageWire,
  PublicSeatMapWire,
  PublicSessionWire,
  PublicSpeakerWire,
  PublicTicketWire,
} from './publicPage.types'

/**
 * The API's public event page → what the four templates render.
 *
 * The templates were built against a demo module where every field was filled
 * in. A real event is emptier: no agenda, no speakers, no FAQs, often one
 * ticket. Everything the API cannot answer is left EMPTY rather than invented —
 * the templates already guard those, and a fabricated "1,500+ attendees" on
 * someone's public page would be a lie this app told about their event.
 */

/** Fields the API holds nothing for. Named so the omission is deliberate. */
const NOT_HELD = {
  /** No headline separate from the name. */
  kicker: '',
  /** The API counts no attendees and publishes no remaining-seat figure. */
  attendeesText: '',
  seatsLeft: 0,
  /** Not on the public payload; the organizer's address is not published. */
  contactEmail: '',
  socials: {},
  /** Read by no template, but part of the shape. */
  accent: '',
  seating: '',
  capacity: 0,
} as const

const TICKETS_TITLE = 'Tickets'
const DEFAULT_HIGHLIGHT_ICON = 'hgi-sparkles'

export function toLandingEvent(page: PublicPageWire): LandingEvent {
  const { event } = page
  // Seat colours follow the API's ticket order, expected to be the order the
  // tickets were created, as the wizard's list is; the cards go cheapest first.
  const byCreation = page.tickets.map((ticket) => ticket.id)
  const tickets = [...page.tickets].sort((a, b) => a.priceSatang - b.priceSatang)
  const seats = seatTypesOf(page.seatMap)

  return {
    ...NOT_HELD,
    slug: event.slug,
    title: event.name,
    // The description does double duty: the hero strapline and the About body.
    // One sentence is what the organizer wrote; there is no second field.
    // Empty on purpose. The templates keep the kit's two slots — a one-line
    // hook in the hero and the full text under "About the event" — but the API
    // has only `description`. Filling both printed the same paragraph twice on
    // every public page. It belongs in the section named for it; the hero line
    // waits for a field of its own.
    tagline: '',
    about: event.description ?? '',
    category: event.categoryName ?? event.type,
    dateText: dateTextOf(event.startAt, event.endAt, event.timezone),
    timeText: timeTextOf(event.startAt, event.endAt, event.timezone),
    venue: event.venueName ?? '',
    city: event.city ?? '',
    address: event.venueAddress ?? '',
    priceFrom: priceFromOf(tickets),
    organizer: event.organizerName,
    registerUrl: `/portal/checkout?event=${encodeURIComponent(event.slug)}`,
    highlights: page.highlights.map((h) => ({
      // An empty or unknown slug renders as a CJK box, not as nothing.
      icon: h.icon?.startsWith('hgi-') ? h.icon : DEFAULT_HIGHLIGHT_ICON,
      label: h.text,
    })),
    agendaTitle: page.sections.agenda,
    agenda: page.agenda.map(toAgendaItem),
    speakersTitle: page.sections.speakers,
    speakers: page.speakers.map(toSpeaker),
    ticketsTitle: TICKETS_TITLE,
    tickets: tickets.map(toTicket(tickets, seats)),
    seatMap: seatMapOf(seats, tickets, byCreation),
    faqs: page.faqs.map((f) => ({ q: f.question, a: f.answer })),
    online: event.isOnline,
    onlineNote: event.onlineNote ?? '',
    image: event.coverImage ?? undefined,
  }
}

/**
 * The price the page leads with — the cheapest tier somebody can actually buy.
 *
 * A sold-out free tier beside a paid one would otherwise headline the page with
 * "Free" when nothing free can be had. When nothing at all is available the
 * cheapest tier still names the price: an event that sold out had one, and "—"
 * would read as not yet priced.
 *
 * `tickets` arrives sorted by price ascending.
 */
function priceFromOf(tickets: PublicTicketWire[]): string {
  const available = tickets.find((ticket) => ticket.canRegister)
  return (available ?? tickets[0])?.priceLabel ?? MASKED
}

/**
 * The date line — in the EVENT's timezone, not the reader's. A public page is
 * opened from anywhere, and the fact on it is the organizer's schedule.
 *
 * Always carries a four-digit year: one template regex-parses this string for
 * its footer copyright and silently shows the browser's year without one.
 */
function dateTextOf(startAt: string, endAt: string | null, tz: string): string {
  const start = bangkokDate(startAt, tz)
  if (!endAt) return start
  const end = bangkokDate(endAt, tz)
  return start === end ? start : `${start} – ${end}`
}

function timeTextOf(startAt: string, endAt: string | null, tz: string): string {
  const start = bangkokTime(startAt, tz)
  return endAt ? `${start} – ${bangkokTime(endAt, tz)}` : start
}

/**
 * Agenda times are Postgres `time` values — a wall clock in the event's own
 * timezone, with no date and no offset. They are trimmed, never converted:
 * treating them as instants would move a real agenda by hours.
 */
function toAgendaItem(session: PublicSessionWire) {
  const start = clock(session.startTime)
  const end = session.endTime ? clock(session.endTime) : ''
  return {
    time: end ? `${start} – ${end}` : start,
    title: session.title,
    // Room and speakers, joined only where both exist — otherwise the
    // separator would hang off an empty line.
    desc: [session.room, session.speakerNames.join(', ')].filter(Boolean).join(' · '),
  }
}

/** `09:30:00` → `09:30`. */
function clock(time: string): string {
  return time.slice(0, 5)
}

function toSpeaker(speaker: PublicSpeakerWire): LandingSpeaker {
  return {
    name: speaker.name,
    // What they are speaking about beats what their job is — the page is about
    // the event, not the org chart.
    role: speaker.talkTitle ?? speaker.role ?? '',
    initials: speaker.initials ?? initials(speaker.name),
  }
}

/** Only the first recommended tier is lifted; two would break the grid. */
function toTicket(ordered: PublicTicketWire[], seats: readonly SeatRowTypes[]) {
  const featured = ordered.find((t) => t.isRecommended)
  return (ticket: PublicTicketWire): LandingTicket => ({
    name: ticket.name,
    // The server already applied the Free / RSVP sentinels the templates branch
    // on. Re-deriving them from satang here would be a second source of truth.
    price: ticket.priceLabel,
    note: noteOf(ticket),
    featured: ticket.id === featured?.id,
    features: ticket.includes,
    rowsLabel: seatsWhereOf(seats, ticket.id),
  })
}

/** Sold out is the fact that matters; then a badge; then the API's own nudge. */
function noteOf(ticket: PublicTicketWire): string {
  if (ticket.soldOut) return 'Sold out'
  return ticket.badge ?? ticket.urgency ?? ''
}

/** A ticket on the page that sells seats, with its colour. */
type KeyedTicket = { ticket: PublicTicketWire; swatch: number }

/** Each row's seats and their types, as the shared seat-places rule reads them; none without a map. */
function seatTypesOf(seatMap: PublicSeatMapWire | null): SeatRowTypes[] {
  return (seatMap?.rows ?? []).map((row) => ({ label: row.label, seats: row.seatTicketTypes }))
}

/**
 * The seat map the tickets section shows (US-PAGE-05), or none.
 *
 * Only the tickets on the page are keyed, in the page's order, each in its
 * colour by the order the tickets were created (`swatchOf`), so a type matches
 * the organizer's preview. A seat whose type is not among them — none at all,
 * or one the page does not offer — stays neutral: it names nothing a reader
 * can buy. A map where every seat is neutral shows no split, so there is no map.
 */
function seatMapOf(
  seats: readonly SeatRowTypes[],
  tickets: readonly PublicTicketWire[],
  byCreation: readonly string[],
): LandingSeatMap | null {
  const keyed = tickets.flatMap((ticket): KeyedTicket[] => {
    const swatch = swatchOf(ticket.id, byCreation)
    return seatsOfType(seats, ticket.id) > 0 && swatch !== null ? [{ ticket, swatch }] : []
  })
  if (keyed.length === 0) return null
  return {
    rows: seats.map((row) => ({ label: row.label, swatches: row.seats.map((type) => swatchOf(type, byCreation)) })),
    legend: keyed.map(({ ticket, swatch }) => ({ label: seatKeyLabelOf(ticket.name, seats, ticket.id), swatch })),
    summary: summaryOf(keyed, seats),
  }
}

/**
 * `Seat map: Free row 7 seats 1–5; Normal rows 3–6, row 7 seats 6–16` — the
 * key, read aloud. Tickets are parted by "; " since one ticket's seats can
 * already take a ", ".
 */
function summaryOf(keyed: readonly KeyedTicket[], seats: readonly SeatRowTypes[]): string {
  return `Seat map: ${keyed.map(({ ticket }) => `${ticket.name} ${seatsWherePhraseOf(seats, ticket.id)}`).join('; ')}`
}
