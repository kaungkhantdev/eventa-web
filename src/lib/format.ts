/** Shared formatters. The kit is Bangkok-based, so money is Thai Baht. */

export const THB = '฿'

/**
 * What a figure the caller may not see renders as.
 *
 * The API masks money it will not disclose as `null` — never `0` — and this
 * keeps that distinction on screen. "You are not allowed to see this" and "it
 * cost nothing" are different facts, and `฿0` would assert the second.
 */
export const MASKED = '—'

/** A price of nothing is described, not priced. */
const FREE = 'Free'
const SATANG_PER_BAHT = 100
/** The product's one timezone: events, deadlines and "today" are Bangkok's. */
const BANGKOK = 'Asia/Bangkok'

/**
 * Which zone to render an instant in.
 *
 * Almost everything in this product is Bangkok's, and callers say nothing. The
 * exception is the public event page: it is read from anywhere, and the fact on
 * screen is the organizer's schedule, not the reader's clock — so it passes the
 * event's own zone.
 *
 * `events.timezone` is free text on the API, and `Intl` throws a RangeError on
 * a value it cannot use. Unchecked, one bad row would take a whole public page
 * down, so an unusable zone falls back rather than throws.
 */
function zone(timeZone?: string): string {
  if (!timeZone) return BANGKOK
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return timeZone
  } catch {
    return BANGKOK
  }
}

/**
 * Integer satang → what the organizer reads. This is the ONLY place money
 * crosses from the wire's integer to a string, so the null/zero rule above is
 * enforced once rather than remembered at every call site.
 */
export function satang(amount: number | null): string {
  if (amount === null) return MASKED
  if (amount === 0) return FREE
  return satangAmount(amount)
}

/**
 * The same conversion with no special case for zero.
 *
 * A price of nothing is "Free"; a SUM of nothing is ฿0. A report column that
 * has to add up, or a payout of no money, would read as nonsense with a word in
 * it — and the reader cannot subtract "Free" from a total.
 */
export function satangAmount(amount: number): string {
  return baht(Math.round(amount / SATANG_PER_BAHT))
}

/** A UTC instant → the Bangkok calendar day, e.g. `Jul 8, 2026`. */
export function bangkokDate(instant: string | null, timeZone?: string): string {
  if (!instant) return MASKED
  return new Date(instant).toLocaleDateString('en-US', {
    timeZone: zone(timeZone),
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** A UTC instant → the spelled-out Bangkok day, e.g. `August 27, 2025`. */
export function bangkokLongDate(instant: string | null, timeZone?: string): string {
  if (!instant) return MASKED
  return new Date(instant).toLocaleDateString('en-US', {
    timeZone: zone(timeZone),
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * A UTC instant → `YYYY-MM-DD` on the Bangkok calendar.
 *
 * Grouping by this key rather than by a local `Date` is what keeps an evening
 * event in the right calendar square: 20:00 UTC is already the next day in
 * Bangkok, and a viewer in London bucketing by their own midnight would file it
 * a day early. `en-CA` is used only because it spells a date as `YYYY-MM-DD`.
 */
export function bangkokDayKey(instant: string | Date): string {
  return new Date(instant).toLocaleDateString('en-CA', {
    timeZone: BANGKOK,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** The same, to the month: `YYYY-MM` — what the calendar endpoint is asked for. */
export function bangkokMonthKey(instant: string | Date): string {
  return bangkokDayKey(instant).slice(0, 'YYYY-MM'.length)
}

/** Bangkok is UTC+7 all year — Thailand has never observed daylight saving. */
const BANGKOK_OFFSET = '+07:00'

/**
 * A Bangkok date (and optional wall time) → the UTC instant the API stores.
 *
 * Built by stating the offset rather than by `new Date(date + 'T' + time)`,
 * which reads the pair in the *browser's* zone and would move every deadline by
 * the organizer's distance from Thailand. Empty in, null out: a date nobody
 * filled in is not midnight today.
 *
 * Unreadable in, null out too — a field the browser degraded to a text box, or
 * a replayed submission, can carry anything. Callers hand what could not be
 * read to the API, which refuses it under its field; throwing here would take
 * the whole route down instead and lose what the organizer had typed.
 */
export function bangkokInstant(date: string, time = '00:00'): string | null {
  if (!date) return null
  const at = new Date(`${date}T${time || '00:00'}:00${BANGKOK_OFFSET}`)
  return Number.isNaN(at.getTime()) ? null : at.toISOString()
}

/**
 * A `datetime-local` value (`YYYY-MM-DDTHH:mm`), picked on the Bangkok clock →
 * the UTC instant the API stores. The field carries no zone of its own; read
 * as the browser's, it would move a scheduled send by the organizer's distance
 * from Thailand. Empty in, null out: an empty field is not "now".
 */
export function bangkokInstantOfLocal(value: string): string | null {
  const [date = '', time = ''] = value.split('T')
  return bangkokInstant(date, time)
}

/** An instant → the `datetime-local` value showing it on the Bangkok clock. */
export function bangkokLocalInput(instant: string): string {
  return `${bangkokDayKey(instant)}T${bangkokTime(instant)}`
}

/**
 * A pair of instants → the dates as a public page spells them, e.g.
 * `Sat–Sun, Jul 18–19, 2026`.
 *
 * Compared on the calendar day in the event's own zone, never on the raw
 * instants: an event ending at 18:00 local is `11:00Z`, and an evening start is
 * already tomorrow in UTC. Comparing instants would split single days and merge
 * separate ones depending on where the reader happens to be sitting.
 */
export function bangkokDateRange(
  startAt: string,
  endAt: string | null,
  timeZone?: string,
): string {
  const where = zone(timeZone)
  const start = new Date(startAt)
  const end = endAt === null ? null : new Date(endAt)
  if (end === null || dayIn(start, where) === dayIn(end, where)) {
    return `${weekday(start, where)}, ${monthDay(start, where)}, ${year(start, where)}`
  }
  if (dayIn(start, where).slice(0, 7) === dayIn(end, where).slice(0, 7)) {
    return (
      `${weekday(start, where)}–${weekday(end, where)}, ` +
      `${monthDay(start, where)}–${dayOfMonth(end, where)}, ${year(end, where)}`
    )
  }
  return `${monthDay(start, where)} – ${monthDay(end, where)}, ${year(end, where)}`
}

/** `YYYY-MM-DD` in the given zone. `en-CA` only because it spells it that way. */
function dayIn(at: Date, timeZone: string): string {
  return at.toLocaleDateString('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const part = (options: Intl.DateTimeFormatOptions) => (at: Date, timeZone: string) =>
  at.toLocaleDateString('en-US', { timeZone, ...options })

const weekday = part({ weekday: 'short' })
const monthDay = part({ month: 'short', day: 'numeric' })
const dayOfMonth = part({ day: 'numeric' })
const year = part({ year: 'numeric' })

/** A UTC instant → the Bangkok wall clock, e.g. `10:24`. */
export function bangkokTime(instant: string | null, timeZone?: string): string {
  if (!instant) return MASKED
  return new Date(instant).toLocaleTimeString('en-GB', {
    timeZone: zone(timeZone),
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 48290 -> "฿48,290" */
export function baht(n: number, opts: { decimals?: number } = {}): string {
  const { decimals = 0 } = opts
  return (
    THB +
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  )
}

/** 48290 -> "฿48.29k" — used in chart axes and compact stat tiles. */
export function bahtCompact(n: number): string {
  if (Math.abs(n) >= 1000) return THB + (n / 1000).toFixed(2).replace(/\.00$/, '') + 'k'
  return THB + n
}

/** 1340 -> "1,340" */
export function num(n: number): string {
  return n.toLocaleString('en-US')
}

/** 0.872 -> "87%" */
export function pct(n: number, decimals = 0): string {
  return (n * 100).toFixed(decimals) + '%'
}

/** "Harper Nelson" -> "HN" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
