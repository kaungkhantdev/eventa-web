import { MASKED, bangkokDayKey, initials as initialsOf } from '@/lib/format'
import { hashIndex } from '@/lib/palette'
import type {
  AgendaBlock,
  AgendaDay,
  SessionType,
  SessionWire,
  SpeakerCard,
  SpeakerTone,
  SpeakerWire,
} from './program.types'

/** The rules behind the agenda and speakers screens (US-PROG-01..07). */

/** The calendar's first hour, and how tall an hour is — the kit's geometry. */
export const FIRST_HOUR = 9
export const LAST_HOUR = 16
export const HOUR_HEIGHT = 64

const MINUTES_PER_HOUR = 60
const MS_PER_DAY = 86_400_000

const TONES: readonly SpeakerTone[] = ['green', 'blue', 'purple', 'amber', 'red', 'pink']

const AVATAR_TONE: Record<SpeakerTone, string> = {
  green: 'bg-brand-soft text-brand',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
}

export function toSpeakerCard(wire: SpeakerWire): SpeakerCard {
  return {
    id: wire.id,
    name: wire.name,
    // Blank, not "null": an unrecorded phone number is an empty line on the
    // card, and the string "null" beside a name is how a demo becomes a bug
    // report.
    role: wire.role ?? '',
    email: wire.email ?? '',
    phone: wire.phone ?? '',
    // Both are the API's when it has them, and derived when it does not: a
    // speaker entered on this screen comes back with neither, and a blank
    // colourless circle beside a name reads as a broken row.
    initials: wire.initials || initialsOf(wire.name),
    avatar: AVATAR_TONE[wire.tone ?? TONES[hashIndex(wire.id, TONES.length)]],
    sessionCount: wire.sessionCount,
    // An unrated speaker has no rating — not a rating of zero. `0.0` beside a
    // name is a claim about their audience that nobody made.
    rating: wire.rating || MASKED,
  }
}

/**
 * One session, placed on the day column.
 *
 * `startTime` is a Postgres `time`: a wall clock with no zone of its own. It is
 * trimmed to `HH:MM`, never converted — running it through a timezone would
 * move a 09:00 session by the reader's distance from the venue.
 */
export function toAgendaBlock(wire: SessionWire): AgendaBlock {
  const start = minutesOf(wire.startTime)
  const end = minutesOf(wire.endTime)
  const top = Math.max(0, offsetOf(start))
  return {
    id: wire.id,
    day: wire.day,
    title: wire.title,
    type: wire.type,
    time: `${clock(wire.startTime)} – ${clock(wire.endTime)}`,
    who: presenter(wire),
    color: wire.color,
    top,
    // A session starting before the calendar does is clipped at the top rather
    // than drawn off it, so what is left still reads as a block.
    height: Math.max(offsetOf(end) - top, HOUR_HEIGHT / 4),
    edit: {
      id: wire.id,
      day: wire.day,
      startTime: clock(wire.startTime),
      endTime: clock(wire.endTime),
      title: wire.title,
      type: wire.type,
      room: wire.room,
      description: wire.description,
      speakerIds: wire.speakers.map((s) => s.id),
      version: wire.version,
    },
  }
}

/** The speakers, or — for a break, which has none — the room it occupies. */
function presenter(wire: SessionWire): string {
  if (wire.speakers.length > 0) return wire.speakers.map((s) => s.name).join(', ')
  return wire.room
}

/** `09:30:00` → `09:30`. */
function clock(time: string): string {
  return time.slice(0, 'HH:MM'.length)
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * MINUTES_PER_HOUR + minutes
}

function offsetOf(minutes: number): number {
  return ((minutes - FIRST_HOUR * MINUTES_PER_HOUR) / MINUTES_PER_HOUR) * HOUR_HEIGHT
}

/**
 * The week strip: one column per day the event runs, on the Bangkok calendar.
 *
 * The API schedules sessions against a 1-based day index and says nothing about
 * what those days are called, so the labels are counted from the event's own
 * start. Counted in Bangkok, because 17:00 UTC is already tomorrow there and a
 * UTC count would label the whole strip a day early.
 */
export function agendaDaysOf(startAt: string, endAt: string | null): AgendaDay[] {
  const first = bangkokDayKey(startAt)
  const last = endAt ? bangkokDayKey(endAt) : first
  const span = Math.max(1, daysBetween(first, last) + 1)

  return Array.from({ length: span }, (_, i) => {
    const day = new Date(`${first}T00:00:00Z`)
    day.setUTCDate(day.getUTCDate() + i)
    return {
      index: i + 1,
      weekday: day.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' }),
      dayOfMonth: String(day.getUTCDate()),
      isFirst: i === 0,
    }
  })
}

/** Whole days between two `YYYY-MM-DD` keys, which carry no time to confuse. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY)
}

/** The hour labels down the side of the calendar. */
export function calendarHours(): number[] {
  return Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
}

/** The five kinds of slot the API accepts. */
export const SESSION_TYPES: readonly SessionType[] = [
  'Keynote',
  'Talk',
  'Workshop',
  'Panel',
  'Break',
]

/**
 * A session type off a form, narrowed to one the API knows.
 *
 * A `<select>` cannot produce anything else today, but the value arrives as a
 * plain string and an unknown one would be a 400 from inside a form submit.
 */
export function sessionTypeOf(value: unknown): SessionType {
  return SESSION_TYPES.includes(value as SessionType) ? (value as SessionType) : 'Talk'
}
