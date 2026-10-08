import {
  bangkokDate,
  bangkokLongDate,
  bangkokTime,
  initials,
  satang,
} from '@/lib/format'
import type { VenueParts } from '@/lib/mapLink'
import type { SessionWire, SpeakerWire } from '@/features/program/program.api'
import type { TicketWire } from '@/features/ticketing/ticketing.api'
import type {
  EventAttendeeWire,
  EventOverviewWire,
  EventRegistrationWire,
} from './eventDetail.api'
import type { EventStatus, EventWire, EventWireStatus } from './types'

/**
 * The event workspace's view models (US-EVT-14).
 *
 * Every figure on this screen comes from the API and is formatted once, here.
 * Two rules do most of the work: withheld money is a dash rather than zero, and
 * a count the API did not send is not reconstructed from the ones it did.
 */

/** Wire status → the word the console shows. Shared: the door station's event
 *  picker paints its status dot from the same mapping. */
export const STATUS_LABEL: Record<EventWireStatus, EventStatus> = {
  draft: 'Draft',
  planned: 'Planned',
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Which avatar tint a person gets.
 *
 * The API sends no colour — it is presentation, not data — so it is derived
 * from the name, which keeps the same person the same colour on every visit
 * instead of shuffling on each render.
 */
const AVATAR_TONES = ['brand', 'blue', 'pink', 'amber', 'violet'] as const
export type AvatarTone = (typeof AVATAR_TONES)[number]

export function toneOf(name: string): AvatarTone {
  let sum = 0
  for (const char of name) sum += char.charCodeAt(0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]!
}

export interface EventHeader {
  id: string
  name: string
  status: EventStatus
  /** `July 18 – 19, 2026 · 09:00`, on the Bangkok calendar. */
  when: string
  /** `BITEC, Bangkok`, `Online`, or empty — never a stray comma. */
  where: string
  /**
   * The venue's parts, unjoined, for the map. `where` is a sentence for a
   * human; a map needs the street address too, which `where` leaves out.
   * Absent for an online event — there is nowhere to point at.
   */
  venue: VenueParts | null
  /**
   * What the organizer wrote about the event. Plain text — the wizard stores
   * what Quill produced as text, so it is rendered as text and never as HTML.
   * Null when there is none, including when it is only whitespace.
   */
  description: string | null
  /** The organizer's own cover, or null — the hero shows its gradient instead. */
  cover: string | null
  /** The slug. Names the downloaded flyer and seeds its QR, nothing visual. */
  seed: string
  version: number
}

/** The hero: what this event is, when and where. */
export function toEventHeader(event: EventWire): EventHeader {
  return {
    id: event.id,
    name: event.name,
    status: STATUS_LABEL[event.status] ?? event.status,
    when: `${dateRange(event.startAt, event.endAt)} · ${bangkokTime(event.startAt)}`,
    where: placeOf(event),
    venue: event.isOnline
      ? null
      : {
          venueName: event.venueName,
          address: event.venueAddress,
          city: event.city,
        },
    description: event.description?.trim() || null,
    cover: event.coverImage ?? null,
    seed: event.slug,
    version: event.version,
  }
}

/** One day, or the span across two — the kit's "Jul 18–19, 2026". */
function dateRange(startAt: string, endAt: string | null): string {
  const start = bangkokLongDate(startAt)
  if (!endAt) return start
  const end = bangkokLongDate(endAt)
  return start === end ? start : `${start} – ${end}`
}

/**
 * Where it happens. An online event says so; a missing venue falls back to the
 * city; neither present prints nothing at all, rather than ", " on its own.
 */
function placeOf(event: EventWire): string {
  if (event.isOnline) return 'Online'
  return [event.venueName, event.city].filter(Boolean).join(', ')
}

export interface OverviewTiles {
  /** `312/400`, or the count alone when the event has no capacity. */
  registrations: string
  fillPercent: number
  ticketsSold: number
  /** `฿284,000`, `Free`, or `—` when the caller may not see it. */
  revenue: string
  daysLeft: number
  publicUrl: string
}

export function toOverview(overview: EventOverviewWire): OverviewTiles {
  return {
    registrations:
      overview.capacity === null
        ? String(overview.registrations)
        : `${overview.registrations}/${overview.capacity}`,
    fillPercent: overview.fillPercent,
    ticketsSold: overview.ticketsSold,
    revenue: satang(overview.revenueSatang),
    daysLeft: overview.daysLeft,
    publicUrl: overview.publicUrl,
  }
}

export interface RegistrationRow {
  reference: string
  name: string
  initials: string
  tone: AvatarTone
  tickets: number
  amount: string
  status: string
  date: string
  time: string
}

/**
 * One registration on the workspace's own tab.
 *
 * The API sends no email and no ticket-tier name here — the queue screen is
 * where that detail lives — so neither is shown rather than invented.
 */
export function toRegistrationRow(entry: EventRegistrationWire): RegistrationRow {
  return {
    reference: entry.reference,
    name: entry.attendeeName,
    initials: initials(entry.attendeeName),
    tone: toneOf(entry.attendeeName),
    tickets: entry.tickets,
    amount: satang(entry.amountSatang),
    status: titleCase(entry.paymentStatus),
    date: bangkokDate(entry.registeredAt),
    time: bangkokTime(entry.registeredAt),
  }
}

/** A stored enum value → the word on screen, without a lookup per status. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export interface AttendeeRow {
  name: string
  email: string
  initials: string
  tone: AvatarTone
  registrations: number
  seats: number
}

export function toAttendeeRow(attendee: EventAttendeeWire): AttendeeRow {
  return {
    name: attendee.name,
    email: attendee.email,
    initials: initials(attendee.name),
    tone: toneOf(attendee.name),
    registrations: attendee.registrations,
    seats: attendee.seats,
  }
}

export interface SpeakerCard {
  id: string
  name: string
  initials: string
  tone: AvatarTone
  role: string
  /** The talk, when the organizer recorded one. */
  talk: string
  /** Their label — "Keynote", "Track A" — or empty. */
  tag: string
  /** `2 sessions` — the API counts them, so the card does not. */
  sessions: string
  photoUrl: string | null
}

export function toSpeakerCard(speaker: SpeakerWire): SpeakerCard {
  return {
    id: speaker.id,
    name: speaker.name,
    initials: initials(speaker.name),
    tone: toneOf(speaker.name),
    role: speaker.role ?? '',
    talk: speaker.talkTitle ?? '',
    tag: speaker.tag ?? '',
    sessions: speaker.sessionCount === 0 ? 'No sessions yet' : plural(speaker.sessionCount, 'session'),
    photoUrl: speaker.photoUrl,
  }
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export interface AgendaSession {
  id: string
  /** `09:00` — the event's own wall clock, as stored. */
  time: string
  /** `45m`, `1h 30m`, or empty when the session has no end. */
  duration: string
  title: string
  type: string
  who: string
  room: string
}

export interface AgendaDay {
  day: number
  sessions: AgendaSession[]
}

/**
 * The agenda, grouped into days.
 *
 * Session times are wall-clock strings the organizer typed against the event's
 * own timezone — not instants — so they are trimmed, never converted.
 */
export function toSessionDay(sessions: readonly SessionWire[]): AgendaDay[] {
  const days = new Map<number, AgendaSession[]>()
  for (const session of [...sessions].sort(byDayThenOrder)) {
    const list = days.get(session.day) ?? []
    list.push({
      id: session.id,
      time: clock(session.startTime),
      duration: lengthOf(session.startTime, session.endTime),
      title: session.title,
      type: session.type,
      who: speakerLine(session.speakers),
      room: session.room ?? '',
    })
    days.set(session.day, list)
  }
  return [...days.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, sessions]) => ({ day, sessions }))
}

function byDayThenOrder(a: SessionWire, b: SessionWire): number {
  return a.day - b.day || a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime)
}

/** `09:00:00` → `09:00`. */
function clock(time: string): string {
  return time.slice(0, 'HH:MM'.length)
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours! * 60 + minutes!
}

function lengthOf(startTime: string, endTime: string | null): string {
  if (!endTime) return ''
  const minutes = minutesOf(endTime) - minutesOf(startTime)
  if (minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

/** "Mei Lin +2" — the kit's own shorthand for a panel. */
function speakerLine(speakers: readonly { name: string }[]): string {
  if (speakers.length === 0) return ''
  const [first, ...rest] = speakers
  return rest.length ? `${first!.name} +${rest.length}` : first!.name
}

/** `09:00` → `09:00:00`, the shape the API stores a session time in. */
export function withSeconds(time: string): string {
  return time.length === 'HH:MM'.length ? `${time}:00` : time
}

/**
 * A start plus a duration → the end time the API wants.
 *
 * The form asks for "45 minutes" because that is how an agenda is planned; the
 * API stores a start and an end. Same fact, converted in one place. A session
 * running past midnight is clamped to 23:59 rather than wrapping into the
 * previous morning.
 */
export function endOf(start: string, minutes: number): string {
  const total = minutesOf(start) + Math.max(0, minutes)
  const capped = Math.min(total, 24 * 60 - 1)
  const hours = Math.floor(capped / 60)
  return `${String(hours).padStart(2, '0')}:${String(capped % 60).padStart(2, '0')}`
}

export interface TicketRow {
  id: string
  name: string
  /** `฿1,250` or `Free`. */
  price: string
  sold: number
  /** `180/200`, or the sold count alone when the tier is unlimited. */
  allocation: string
  /** sold ÷ allocation, 0–100; zero for an unlimited tier. */
  soldPercent: number
  status: string
}

/**
 * One ticket tier.
 *
 * Deliberately carries no revenue figure: the API reports none per tier, and
 * `sold × price` is not revenue — it ignores discounts and refunds.
 */
export function toTicketRow(ticket: TicketWire): TicketRow {
  return {
    id: ticket.id,
    name: ticket.name,
    price: ticket.isFree ? 'Free' : satang(ticket.priceSatang),
    sold: ticket.sold,
    // `total: 0` is the API's "unlimited". Printing "12/0" would read as an
    // allocation of nothing that has somehow sold twelve.
    allocation: ticket.total > 0 ? `${ticket.sold}/${ticket.total}` : String(ticket.sold),
    soldPercent: ticket.total > 0 ? Math.round((ticket.sold / ticket.total) * 100) : 0,
    status: titleCase(ticket.status.replace(/_/g, ' ')),
  }
}
