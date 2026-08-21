import { bangkokDayKey, bangkokInstant, bangkokTime } from '@/lib/format'
import type { TicketWire } from '@/features/ticketing/ticketing.api'
import type { EventType, EventWire, EventWireStatus } from './types'

/**
 * The create/edit wizard's rules.
 *
 * Two things make this screen different from the rest of the console. It is a
 * two-phase save — `POST /events` accepts only a handful of fields and returns
 * a draft, and everything else is a `PATCH` against the id it gave back — and
 * it is the one place the app decides whether the API will accept a publish
 * before asking, so the organizer is told what is missing rather than being
 * refused after the click.
 */

/** A ticket row in the form. `id` is null until the API has stored it. */
export interface TicketDraft {
  id: string | null
  name: string
  /** Whole baht as typed. Converted to satang at the edge, never before. */
  price: string
  quantity: string
  isFree: boolean
}

export interface HighlightDraft {
  text: string
  icon?: string | null
}

/** Everything the five steps hold. */
export interface EventFormValues {
  id: string | null
  status: EventWireStatus | null
  name: string
  description: string
  type: EventType
  /** `2026-07-18` and `09:00`, the Bangkok wall clock the organizer set. */
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  venueName: string
  venueAddress: string
  city: string
  isOnline: boolean
  onlineNote: string
  seatingMode: 'ga' | 'reserved'
  capacity: string
  seatMapName: string
  seatRows: string
  seatsPerRow: string
  coverImage: string
  tickets: TicketDraft[]
  highlights: HighlightDraft[]
  /** Optimistic-concurrency token; null until the event exists. */
  version: number | null
}

const DEFAULT_TYPE: EventType = 'Conference'

/** What a fresh wizard starts with. */
function emptyValues(): EventFormValues {
  return {
    id: null,
    status: null,
    name: '',
    description: '',
    type: DEFAULT_TYPE,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    venueName: '',
    venueAddress: '',
    city: '',
    isOnline: false,
    onlineNote: '',
    seatingMode: 'ga',
    capacity: '',
    seatMapName: '',
    seatRows: '',
    seatsPerRow: '',
    coverImage: '',
    tickets: [],
    highlights: [],
    version: null,
  }
}

/** Whole baht as typed → integer satang, or nothing when it was not a price. */
export function satangOf(price: string): number | undefined {
  const baht = Number(price)
  if (!Number.isFinite(baht) || baht < 0 || price.trim() === '') return undefined
  return Math.round(baht * 100)
}

/** Integer satang → what goes back in the input. */
export function bahtOf(satang: number): string {
  return String(satang / 100)
}

/** An event being edited → the form. `null` means a new one. */
export function toEventFormValues(
  event: EventWire | null,
  tickets: readonly TicketWire[],
  highlights: readonly HighlightDraft[],
): EventFormValues {
  const empty = emptyValues()
  if (!event) return { ...empty, highlights: [...highlights] }

  return {
    ...empty,
    id: event.id,
    status: event.status,
    name: event.name,
    description: event.description ?? '',
    type: event.type,
    startDate: bangkokDayKey(event.startAt),
    startTime: bangkokTime(event.startAt),
    endDate: event.endAt ? bangkokDayKey(event.endAt) : '',
    endTime: event.endAt ? bangkokTime(event.endAt) : '',
    venueName: event.venueName ?? '',
    city: event.city ?? '',
    isOnline: event.isOnline,
    capacity: event.capacity === null ? '' : String(event.capacity),
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.isFree ? '' : bahtOf(ticket.priceSatang),
      quantity: String(ticket.total),
      isFree: ticket.isFree,
    })),
    highlights: [...highlights],
    version: event.version,
  }
}

/** The body `POST /events` accepts — and nothing else, since it rejects extras. */
export function toCreateBody(values: EventFormValues) {
  const description = values.description.trim()
  return {
    name: values.name.trim(),
    type: values.type,
    startAt: bangkokInstant(values.startDate, values.startTime),
    ...(description ? { description } : {}),
  }
}

/**
 * Everything the create call could not carry.
 *
 * A cleared text field is sent as `''` rather than omitted: omission means
 * "leave it alone" to the API, and the organizer meant "remove it". Fields the
 * wizard has no input for — `contactEmail`, `accentColor` — are left out
 * entirely, so a value set on another screen survives a save here.
 */
export function toUpdateBody(values: EventFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    type: values.type,
    startAt: bangkokInstant(values.startDate, values.startTime),
    endAt: bangkokInstant(values.endDate, values.endTime),
    venueName: values.venueName.trim(),
    venueAddress: values.venueAddress.trim(),
    city: values.city.trim(),
    isOnline: values.isOnline,
    onlineNote: values.onlineNote.trim(),
    coverImage: values.coverImage.trim(),
    ...(values.version === null ? {} : { version: values.version }),
  }
}

/**
 * The API's own publish requirements, checked here first.
 *
 * `events.service.ts` refuses a publish with a 422 listing what is missing.
 * The same four rules are applied to the loaded event so the wizard can say so
 * on the Review step instead of letting someone click a button that cannot
 * work. The server still decides — this only saves a doomed request.
 */
export function publishGaps(values: EventFormValues): string[] {
  const gaps: string[] = []
  if (!values.name.trim()) gaps.push('a title')
  if (!values.description.trim()) gaps.push('a description')
  if (!values.venueName.trim() && !values.isOnline) gaps.push('a venue or an online link')
  // Only tiers the API has stored count — an unsaved row would turn the button
  // green and the request would still be refused.
  if (!values.tickets.some((ticket) => ticket.id !== null)) gaps.push('at least one ticket type')
  return gaps
}
