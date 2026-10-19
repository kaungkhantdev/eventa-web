/* Shared types for the landing-page templates. Every template renders the same
   event object shape (ported from assets/landing-data.js), so the data lives in
   one typed module and each template reads the slice it needs. */

export type LandingHighlight = { icon: string; label: string }
export type LandingAgendaItem = { time: string; title: string; desc: string }
export type LandingSpeaker = { name: string; role: string; initials: string }
export type LandingTicket = {
  name: string
  price: string
  note: string
  featured: boolean
  features: string[]
  /**
   * Where this ticket's seats are — `Rows 1–2`, `Row 7 seats 1–5` (`@/lib/seatPlaces`) —
   * or null when it sells none in particular.
   */
  rowsLabel: string | null
}
/**
 * One seat row: its number, and each seat's ticket colour (`@/lib/seatSwatches`),
 * seat 1 first, or null for a neutral seat.
 */
export type LandingSeatRow = { label: string; swatches: (number | null)[] }
/** One key entry — `VIP · Rows 1–2 · 32 seats` — in its seats' colour. */
export type LandingSeatLegendEntry = { label: string; swatch: number }
/** How a reserved event's seats are split between its tickets (US-PAGE-05). */
export type LandingSeatMap = {
  /** Front to back. */
  rows: LandingSeatRow[]
  legend: LandingSeatLegendEntry[]
  /** The split in one line, for a screen reader: `Seat map: VIP rows 1–2; …`. */
  summary: string
}
export type LandingFaq = { q: string; a: string }
export type LandingSocials = { instagram?: string; website?: string }

export type LandingEvent = {
  slug: string
  title: string
  kicker: string
  tagline: string
  category: string
  dateText: string
  timeText: string
  venue: string
  city: string
  address: string
  priceFrom: string
  seating: string
  seatsLeft: number
  capacity: number
  attendeesText: string
  accent: string
  organizer: string
  contactEmail: string
  registerUrl: string
  socials: LandingSocials
  about: string
  highlights: LandingHighlight[]
  agendaTitle: string
  agenda: LandingAgendaItem[]
  speakersTitle: string
  speakers: LandingSpeaker[]
  ticketsTitle: string
  tickets: LandingTicket[]
  /** Only a reserved event whose seats have ticket types has one. */
  seatMap: LandingSeatMap | null
  faqs: LandingFaq[]
  /** Optional — used by the ?online=1 preview and templates' online branch. */
  online?: boolean
  onlineNote?: string
  image?: string
}
