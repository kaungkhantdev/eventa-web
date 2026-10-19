import { MASKED, bangkokDate, bangkokTime, initials, num } from '@/lib/format'
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
  const tickets = [...page.tickets].sort((a, b) => a.priceSatang - b.priceSatang)
  const rowsByTicket = rowsByTicketOf(page.seatMap)

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
    tickets: tickets.map(toTicket(tickets, rowsByTicket)),
    seatMap: seatMapOf(page.seatMap, tickets, rowsByTicket),
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
function toTicket(ordered: PublicTicketWire[], rowsByTicket: RowsByTicket) {
  const featured = ordered.find((t) => t.isRecommended)
  return (ticket: PublicTicketWire): LandingTicket => ({
    name: ticket.name,
    // The server already applied the Free / RSVP sentinels the templates branch
    // on. Re-deriving them from satang here would be a second source of truth.
    price: ticket.priceLabel,
    note: noteOf(ticket),
    featured: ticket.id === featured?.id,
    features: ticket.includes,
    rowsLabel: rowsLabelOf(rowsByTicket.get(ticket.id) ?? []),
  })
}

/** Sold out is the fact that matters; then a badge; then the API's own nudge. */
function noteOf(ticket: PublicTicketWire): string {
  if (ticket.soldOut) return 'Sold out'
  return ticket.badge ?? ticket.urgency ?? ''
}

/** Each ticket's seat row labels, front to back, keyed by ticket id. */
type RowsByTicket = ReadonlyMap<string, readonly string[]>

/** A ticket on the page that sells seat rows, with those rows. */
type TicketRows = { ticket: PublicTicketWire; rows: readonly string[] }

/** No map, or no typed row, is no rows for any ticket. */
function rowsByTicketOf(seatMap: PublicSeatMapWire | null): RowsByTicket {
  const rows = new Map<string, string[]>()
  for (const { label, ticketTypeId } of seatMap?.rows ?? []) {
    if (ticketTypeId !== null) rows.set(ticketTypeId, [...(rows.get(ticketTypeId) ?? []), label])
  }
  return rows
}

/**
 * The seat map the tickets section shows (US-PAGE-05), or none.
 *
 * Only the tickets on the page are keyed, in the page's order, and each takes
 * the next colour. A row whose type is not among them — none at all, or one
 * the page does not offer — stays neutral: it names nothing a reader can buy.
 * A map where every row is neutral shows no split, so there is no map.
 */
function seatMapOf(
  seatMap: PublicSeatMapWire | null,
  tickets: readonly PublicTicketWire[],
  rowsByTicket: RowsByTicket,
): LandingSeatMap | null {
  const keyed = tickets.flatMap((ticket): TicketRows[] => {
    const rows = rowsByTicket.get(ticket.id)
    return rows ? [{ ticket, rows }] : []
  })
  if (!seatMap || keyed.length === 0) return null
  const swatchOf = new Map<string | null, number>(keyed.map(({ ticket }, swatch) => [ticket.id, swatch]))
  return {
    seatsPerRow: seatMap.seatsPerRow,
    rows: seatMap.rows.map((row) => ({ label: row.label, swatch: swatchOf.get(row.ticketTypeId) ?? null })),
    legend: keyed.map((entry, swatch) => ({ label: legendLabelOf(entry, seatMap.seatsPerRow), swatch })),
    summary: summaryOf(keyed),
  }
}

/** `Seat map: VIP rows 1–2, Normal rows 3–6` — the key, read aloud. */
function summaryOf(keyed: readonly TicketRows[]): string {
  return `Seat map: ${keyed.map(({ ticket, rows }) => `${ticket.name} ${rowsPhraseOf(rows)}`).join(', ')}`
}

/** `VIP · Rows 1–2 · 32 seats` — whole rows, so every row holds the same seats. */
function legendLabelOf({ ticket, rows }: TicketRows, seatsPerRow: number): string {
  const seats = rows.length * seatsPerRow
  return `${ticket.name} · ${rowsLabelOf(rows)} · ${num(seats)} ${seats === 1 ? 'seat' : 'seats'}`
}

/** `Rows 1–2`, `Row 7`, `Rows 1, 3–4`; null for a ticket that sells no rows. */
function rowsLabelOf(rows: readonly string[]): string | null {
  if (rows.length === 0) return null
  return `${rows.length === 1 ? 'Row' : 'Rows'} ${rowRangesOf(rows)}`
}

/** The same mid-sentence: `rows 1–2`, `row 7`. */
function rowsPhraseOf(rows: readonly string[]): string {
  return `${rows.length === 1 ? 'row' : 'rows'} ${rowRangesOf(rows)}`
}

/** `1, 2, 4` → `1–2, 4`: consecutive row numbers collapse into a range. */
function rowRangesOf(rows: readonly string[]): string {
  const runs: string[][] = []
  for (const row of rows) {
    const run = runs.at(-1)
    if (run && Number(run.at(-1)) + 1 === Number(row)) run.push(row)
    else runs.push([row])
  }
  return runs.map((run) => (run.length === 1 ? run[0] : `${run[0]}–${run.at(-1)}`)).join(', ')
}
