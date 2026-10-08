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
  faqs: LandingFaq[]
  /** Optional — used by the ?online=1 preview and templates' online branch. */
  online?: boolean
  onlineNote?: string
  image?: string
}
