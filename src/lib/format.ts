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
