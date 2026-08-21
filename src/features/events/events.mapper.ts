import { bangkokDayKey, bangkokLongDate, bangkokTime } from '@/lib/format'
import { FALLBACK_TYPE_META, TYPE_META } from './events.presentation'
import type {
  CalendarEvent,
  EventListItemWire,
  EventRow,
  EventStatus,
  EventType,
  EventWire,
  EventWireStatus,
  UpcomingCard,
  UpcomingEventWire,
} from './types'

/** Stored status → the word the console shows. A lookup, so a new one is a line. */
const STATUS_LABEL: Record<EventWireStatus, EventStatus> = {
  draft: 'Draft',
  planned: 'Planned',
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** Icon and tone for a type, tolerating one this build has not been taught. */
function metaOf(type: EventType) {
  return TYPE_META[type] ?? FALLBACK_TYPE_META
}

/**
 * How full an event is, as the table prints it.
 *
 * The denominator is the event's own headcount capacity. When that is unset the
 * API still reports a `fillPercent` — it falls back to the sum of the ticket
 * tiers' quantities, which this row does not carry — so the count is shown
 * alone rather than reverse-engineering a total that might not match.
 */
function registrationsOf(sold: number, capacity: number | null): string {
  return capacity === null ? String(sold) : `${sold}/${capacity}`
}

/** One row of the events table (US-EVT-01). */
export function toEventRow(item: EventListItemWire): EventRow {
  const { icon, tone } = metaOf(item.type)
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    date: bangkokLongDate(item.startAt),
    registrations: registrationsOf(item.registrations, item.capacity),
    fillPercent: item.fillPercent,
    status: STATUS_LABEL[item.status] ?? item.status,
    icon,
    tone,
    seed: item.slug,
    version: item.version,
  }
}

/**
 * One card of the upcoming grid (US-EVT-12).
 *
 * `daysLeft` and `fillPercent` are passed through untouched: both are counted
 * by the API in Asia/Bangkok, and recounting them against the browser's clock
 * or its own arithmetic is how the two screens start disagreeing.
 */
export function toUpcomingCard(item: UpcomingEventWire): UpcomingCard {
  const { icon, tone } = metaOf(item.type)
  return {
    id: item.id,
    name: item.name,
    daysLeft: item.daysLeft,
    registrations: registrationsOf(item.sold, item.capacity),
    sold: item.sold,
    fillPercent: item.fillPercent,
    icon,
    tone,
    seed: item.slug,
  }
}

/**
 * A month's events, ready to drop into calendar squares (US-EVT-12).
 *
 * Sorted here rather than in each cell so the agenda and the grid can never
 * present the same day in a different order.
 */
export function toCalendarEvents(events: readonly EventWire[]): CalendarEvent[] {
  return events
    .map((event) => ({
      id: event.id,
      name: event.name,
      day: bangkokDayKey(event.startAt),
      time: bangkokTime(event.startAt),
      tone: metaOf(event.type).tone,
    }))
    .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))
}
