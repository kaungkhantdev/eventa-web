/**
 * The events feature's vocabulary: what the API puts on the wire, and what the
 * pages render.
 *
 * The `*Wire` shapes mirror eventa-api's DTOs exactly — nothing outside
 * `events.mapper.ts` / `categories.mapper.ts` should read them. Everything else
 * works with the view models below, which are already display-ready.
 */

export type Tone = 'brand' | 'blue' | 'pink' | 'amber' | 'violet' | 'indigo' | 'teal' | 'red'

/** `event_type` — the API's enum, spelled exactly as the kit spells it. */
export type EventType =
  | 'Conference'
  | 'Networking'
  | 'Workshop'
  | 'Charity & Gala'
  | 'Sports & Wellness'
  | 'Concert & Festival'
  | 'Exhibition'
  | 'Seminar'

/** `event_status` as stored. */
export type EventWireStatus =
  | 'draft'
  | 'planned'
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'cancelled'

/** The same, in the words the console shows. */
export type EventStatus = 'Draft' | 'Planned' | 'Upcoming' | 'Live' | 'Completed' | 'Cancelled'

export type EventBucket = 'active' | 'completed'

/** How the list may be ordered — the API's `sort`, in its own spelling. */
export type EventSort = 'registrations' | 'name' | 'date' | 'recent'

/* ------------------------------- wire shapes ------------------------------ */

/** `EventResponseDto` — the fields this app actually reads. */
export interface EventWire {
  id: string
  slug: string
  name: string
  description: string | null
  type: EventType
  status: EventWireStatus
  bucket: EventBucket
  startAt: string
  endAt: string | null
  venueName: string | null
  /** The street address — what a map needs; a venue name alone rarely resolves. */
  venueAddress?: string | null
  city: string | null
  isOnline: boolean
  capacity: number | null
  /**
   * Attendees may join a waitlist once a general-admission ticket sells out
   * (US-REG-04). Optional: only the full event response carries it.
   */
  waitlistEnabled?: boolean
  /**
   * The landing page's hero image — null until one is uploaded. Optional
   * because the calendar's slimmer payload leaves it out; the list and detail
   * endpoints both carry it (`EventListItemDto`, `EventResponseDto`).
   */
  coverImage?: string | null
  /** The public page's design — null until one has been chosen. */
  landingTemplateId?: string | null
  /**
   * `public` | `unlisted` | `private` (`EventResponseDto.visibility`). Only a
   * `public` event is served by slug, so this decides whether a real public
   * page exists to link to. Optional: the calendar's slimmer payload omits it.
   */
  visibility?: string
  version: number
}

/** `EventListItemDto` — an event plus how full it is. */
export interface EventListItemWire extends EventWire {
  /** Tickets sold so far. */
  registrations: number
  /** The API's own `registrations ÷ capacity`, 0–100. Never recomputed here. */
  fillPercent: number
}

/** `EventsSummaryDto` — the Active/Completed tab badges. */
export interface EventsSummaryWire {
  active: number
  completed: number
}

/** `UpcomingEventDto` — the soonest-first card grid. */
export interface UpcomingEventWire {
  id: string
  name: string
  slug: string
  type: EventType
  status: EventWireStatus
  startAt: string
  /** Whole days until the start, counted in Bangkok — by the API, not here. */
  daysLeft: number
  sold: number
  capacity: number
  fillPercent: number
}

/** `CalendarResponseDto` — one Bangkok month of events. */
export interface CalendarWire {
  month: string
  count: number
  events: EventWire[]
}

/** `CategoryResponseDto`. */
export interface CategoryWire {
  id: number
  name: string
  description: string | null
  icon: string
  color: string
  eventCount: number
  createdAt: string
  version: number
}

/* ------------------------------- view models ------------------------------ */

/** A row of the events table — every field already display-ready. */
export interface EventRow {
  id: string
  name: string
  type: EventType
  /** `August 27, 2025`, on the Bangkok calendar. */
  date: string
  /** `39/50`, or just `39` when the event has no capacity set. */
  registrations: string
  /** The API's fill, 0–100 — what the progress bar and the `%` both read. */
  fillPercent: number
  status: EventStatus
  icon: string
  tone: Tone
  /**
   * The organizer's own cover, or null. Never a stand-in: the row used to seed
   * a photo service from the slug, which put a stranger's photograph next to a
   * real event and kept it there after a cover was uploaded.
   */
  cover: string | null
  version: number
}

/** A card in the upcoming grid. */
export interface UpcomingCard {
  id: string
  name: string
  daysLeft: number
  /** `39/50` — an upcoming event always has an effective capacity. */
  registrations: string
  sold: number
  fillPercent: number
  icon: string
  tone: Tone
}

/** One event as the calendar renders it. */
export interface CalendarEvent {
  id: string
  name: string
  /** `YYYY-MM-DD` in Bangkok — the square it belongs in. */
  day: string
  /** `09:00`, Bangkok wall clock. Zero-padded, so string sort is time sort. */
  time: string
  tone: Tone
}

/** A category card. */
export interface CategoryCard {
  id: number
  name: string
  description: string
  icon: string
  color: Tone
  eventCount: number
  version: number
}
