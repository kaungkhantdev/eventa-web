/**
 * `GET /public/events/:slug`, exactly as eventa-api describes it.
 *
 * Transcribed from the server's `public-pages.types.ts`. Nothing outside the
 * mapper reads these — the templates render `LandingEvent`.
 */

export interface PublicEventWire {
  id: string
  slug: string
  name: string
  description: string | null
  type: string
  categoryName: string | null
  /** UTC instant. */
  startAt: string
  endAt: string | null
  /** IANA name, free text on the server — may be unusable. */
  timezone: string
  isOnline: boolean
  /** How the join link arrives; the link itself is never public. */
  onlineNote: string | null
  venueName: string | null
  venueAddress: string | null
  city: string | null
  coverImage: string | null
  accentColor: string
  organizerName: string
  /** One of the four template ids — typed loosely by the API. */
  template: string
  locale: string
}

export interface PublicHighlightWire {
  text: string
  icon: string | null
}

export interface PublicSessionWire {
  title: string
  day: number
  /**
   * Clock time in the event's own timezone — a Postgres `time`, so `HH:MM:SS`.
   * The API's doc comment says `HH:MM`; the column is what actually ships.
   */
  startTime: string
  endTime: string | null
  type: string
  room: string | null
  speakerNames: string[]
}

export interface PublicSpeakerWire {
  name: string
  role: string | null
  talkTitle: string | null
  initials: string | null
  tone: string | null
}

export interface PublicTicketWire {
  id: string
  /** Already formatted, VAT-inclusive: `฿1,070`, `Free` or `RSVP`. */
  priceLabel: string
  name: string
  priceSatang: number
  isFree: boolean
  includes: string[]
  isRecommended: boolean
  badge: string | null
  soldOut: boolean
  /** A whole sentence when stock is low — "Going fast — only 3 left". */
  urgency: string | null
  canRegister: boolean
}

export interface PublicFaqWire {
  question: string
  answer: string
}

/**
 * A reserved event's seat rows and the ticket type each seat sells (US-EVT-05:
 * a row's seats may be split between types). Nothing about any seat's sale is
 * published.
 */
export interface PublicSeatMapWire {
  seatsPerRow: number
  /** Front to back, by row number; labels are `"1"`, `"2"`, … */
  rows: {
    label: string
    /** The `tickets[].id` every seat of the row shares, or null when they differ or have none. */
    ticketTypeId: string | null
    /** Each seat's `tickets[].id` in seat-number order, seat 1 first; null for a seat with none. */
    seatTicketTypes: (string | null)[]
  }[]
}

export interface PublicPageWire {
  event: PublicEventWire
  highlights: PublicHighlightWire[]
  agenda: PublicSessionWire[]
  speakers: PublicSpeakerWire[]
  /**
   * Expected in the order the organizer created them — the wizard's order —
   * because the seat map colours each type by its place here (`swatchOf`).
   */
  tickets: PublicTicketWire[]
  faqs: PublicFaqWire[]
  /**
   * Null unless the event is in person, reserved, and gives at least one seat
   * a ticket type — general admission, online and untyped maps send none.
   */
  seatMap: PublicSeatMapWire | null
  registration: { open: boolean; reason: string | null }
  sections: { agenda: string; speakers: string }
  share: {
    title: string
    description: string
    image: string | null
    url: string
    noIndex: boolean
  }
}
